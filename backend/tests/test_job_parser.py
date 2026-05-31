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


# --- _check_redirect_target --------------------------------------------------

def _redirect(location: str, *, start: str = "https://8.8.8.8/start", status: int = 302):
    return httpx.Response(
        status,
        headers={"location": location},
        request=httpx.Request("GET", start),
    )


def test_redirect_to_public_is_allowed():
    # Should not raise.
    jp._check_redirect_target(_redirect("https://1.1.1.1/next"))


def test_redirect_to_private_is_blocked():
    with pytest.raises(HTTPException) as exc:
        jp._check_redirect_target(_redirect("http://169.254.169.254/latest/"))
    assert exc.value.status_code == 400


def test_redirect_relative_resolved_against_public_base_is_allowed():
    # Relative redirect resolves against the public start host -> allowed.
    jp._check_redirect_target(_redirect("/another/path"))


def test_redirect_to_non_http_scheme_is_blocked():
    with pytest.raises(HTTPException) as exc:
        jp._check_redirect_target(_redirect("file:///etc/passwd"))
    assert exc.value.status_code == 400


def test_non_redirect_response_is_ignored():
    ok = httpx.Response(200, request=httpx.Request("GET", "https://8.8.8.8/"))
    jp._check_redirect_target(ok)  # no exception


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
