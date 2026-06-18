"""Unit tests for the job-parser service, focused on the SSRF guard.

These run offline: _is_public_address is exercised with literal IP addresses,
which socket.getaddrinfo resolves without a DNS lookup. The redirect hook is
fed hand-built httpx.Response objects, and the Gemini extraction is monkeypatched
so no network or API key is required.
"""

from __future__ import annotations

import httpx
import pytest
from fastapi import HTTPException

from app.services import job_parser as jp


# --- _is_public_address ------------------------------------------------------

@pytest.mark.parametrize(
    "host",
    [
        "127.0.0.1",      # loopback
        "10.0.0.1",       # RFC1918
        "172.16.0.1",     # RFC1918
        "192.168.1.1",    # RFC1918
        "169.254.169.254",  # link-local (AWS metadata endpoint)
        "0.0.0.0",        # unspecified
        "::1",            # IPv6 loopback
    ],
)
def test_is_public_address_rejects_internal(host):
    assert jp._is_public_address(host) is False


@pytest.mark.parametrize("host", ["8.8.8.8", "1.1.1.1", "93.184.216.34"])
def test_is_public_address_allows_public(host):
    assert jp._is_public_address(host) is True


def test_is_public_address_rejects_unresolvable():
    # A syntactically invalid host can't resolve -> treated as not public.
    assert jp._is_public_address("not a real host at all .invalid") is False


# --- _validate_url -----------------------------------------------------------

def test_validate_url_accepts_public_http():
    assert jp._validate_url("http://8.8.8.8/jobs/1") == "http://8.8.8.8/jobs/1"


@pytest.mark.parametrize(
    "url",
    [
        "ftp://8.8.8.8/x",        # non-http scheme
        "file:///etc/passwd",      # non-http scheme
        "javascript:alert(1)",     # non-http scheme
    ],
)
def test_validate_url_rejects_non_http_scheme(url):
    with pytest.raises(HTTPException) as exc:
        jp._validate_url(url)
    assert exc.value.status_code == 400


def test_validate_url_rejects_missing_host():
    with pytest.raises(HTTPException) as exc:
        jp._validate_url("http://")
    assert exc.value.status_code == 400


@pytest.mark.parametrize(
    "url",
    [
        "http://127.0.0.1/admin",
        "http://169.254.169.254/latest/meta-data/",
        "http://10.0.0.5/internal",
    ],
)
def test_validate_url_rejects_internal_targets(url):
    with pytest.raises(HTTPException) as exc:
        jp._validate_url(url)
    assert exc.value.status_code == 400


# --- _resolve_public_ip ------------------------------------------------------

@pytest.mark.parametrize("host", ["8.8.8.8", "1.1.1.1"])
def test_resolve_public_ip_returns_the_address(host):
    # Literal public IPs resolve to themselves (no DNS), so the pinned IP is known.
    assert jp._resolve_public_ip(host) == host


@pytest.mark.parametrize("host", ["127.0.0.1", "10.0.0.1", "169.254.169.254", "::1"])
def test_resolve_public_ip_blocks_internal(host):
    with pytest.raises(jp._BlockedTarget):
        jp._resolve_public_ip(host)


def test_resolve_public_ip_blocks_unresolvable():
    with pytest.raises(jp._BlockedTarget):
        jp._resolve_public_ip("not a real host at all .invalid")


# --- _PinnedTransport --------------------------------------------------------
# The transport re-validates and pins every hop (initial + redirects), which is
# what closes the DNS-rebinding gap. These exercise it without real networking.

def test_transport_pins_connection_to_resolved_ip(monkeypatch):
    captured = {}

    def fake_parent(self, request):
        # Stand in for the real socket-opening parent; record what it'd dial.
        captured["host"] = request.url.host
        captured["sni"] = request.extensions.get("sni_hostname")
        return httpx.Response(200, request=request)

    monkeypatch.setattr(httpx.HTTPTransport, "handle_request", fake_parent)
    resp = jp._PinnedTransport().handle_request(
        httpx.Request("GET", "http://8.8.8.8/jobs")
    )
    assert resp.status_code == 200
    assert captured["host"] == "8.8.8.8"  # connection pinned to the resolved IP
    assert captured["sni"] == "8.8.8.8"   # TLS SNI bound to the hostname


@pytest.mark.parametrize(
    "url",
    [
        "http://127.0.0.1/admin",       # private IP
        "http://169.254.169.254/meta",  # link-local (cloud metadata)
        "http://8.8.8.8:22/",           # non-standard port
        "ftp://8.8.8.8/x",              # non-http scheme
    ],
)
def test_transport_blocks_unsafe_targets(url):
    with pytest.raises(jp._BlockedTarget):
        jp._PinnedTransport().handle_request(httpx.Request("GET", url))


# --- _coerce -----------------------------------------------------------------

@pytest.mark.parametrize(
    "value,expected",
    [
        (None, None),
        ("", None),
        ("   ", None),
        ("  Acme  ", "Acme"),
        (123, "123"),
    ],
)
def test_coerce(value, expected):
    assert jp._coerce(value) == expected


# --- parse_job (pasted-text path, Gemini mocked) -----------------------------

def test_parse_job_pasted_text(monkeypatch):
    monkeypatch.setattr(
        jp,
        "_extract_with_gemini",
        lambda text, url, api_key: {
            "company": "Acme",
            "role": "Engineer",
            "location": None,
            "salary_range": "  ",
            "job_url": None,
        },
    )
    result = jp.parse_job(url=None, text="We are hiring an engineer", api_key="k")
    assert result.company == "Acme"
    assert result.role == "Engineer"
    assert result.location is None
    assert result.salary_range is None  # whitespace coerced to None
    assert result.job_url is None       # no source url for pasted text


def test_parse_job_empty_input_raises():
    with pytest.raises(HTTPException) as exc:
        jp.parse_job(url=None, text="   ", api_key="k")
    assert exc.value.status_code == 400


def test_parse_job_blocks_internal_url():
    # The URL path is rejected by the up-front SSRF gate before any fetch.
    with pytest.raises(HTTPException) as exc:
        jp.parse_job(url="http://127.0.0.1/admin", text=None, api_key="k")
    assert exc.value.status_code == 400
