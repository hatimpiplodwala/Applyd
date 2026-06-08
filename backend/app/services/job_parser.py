"""Job-posting parsing: fetch a page (or take pasted text), strip it to text,
and extract structured fields with Gemini. Kept separate from the router so the
HTTP layer stays thin and this logic is testable in isolation.
"""

from __future__ import annotations

import ipaddress
import json
import logging
import re
import socket
from functools import lru_cache
from urllib.parse import urljoin, urlparse

import httpx
from fastapi import HTTPException
from google import genai
from google.genai import types as genai_types

from app.schemas import ParseUrlResponse

logger = logging.getLogger(__name__)

# Bound the fetch so a malicious URL can't tie up the worker or blow memory.
FETCH_TIMEOUT_SECONDS = 8.0
MAX_BYTES = 1_500_000  # ~1.5MB raw HTML
MAX_TEXT_CHARS = 18_000  # truncate before sending to the LLM

# Only fetch over the standard web ports. Combined with the public-IP check,
# this shrinks the SSRF surface: even if a host rebinds or redirects to a
# private IP, it can't reach internal services listening on non-standard ports
# (databases, admin panels, etc.). Cap the redirect chain for the same reason.
ALLOWED_PORTS = {80, 443}
MAX_REDIRECTS = 5

GEMINI_MODEL = "gemini-2.5-flash"

SYSTEM_PROMPT = (
    "You extract structured job application data from job-posting page text. "
    "Reply ONLY with a JSON object — no prose, no markdown fences. "
    "Schema: {company, role, location, salary_range, job_url}. "
    "Use null for any field you cannot confidently extract. "
    "Do not invent values. salary_range should be a short string like "
    '"$120k-$150k" when present, otherwise null.'
)


def _is_public_address(host: str) -> bool:
    """Reject hostnames that resolve to loopback / private / link-local IPs.

    Defends against SSRF where the URL points to internal services
    (cloud metadata, internal admin UIs, RFC1918 subnets).

    Residual risk: this resolves DNS here and httpx resolves again at connect
    time, so a DNS-rebinding attacker could pass this check and then have the
    connection land on a private IP. Closing that fully requires pinning the
    connection to the validated IP (a custom transport). Given this endpoint is
    authenticated and rate-limited, that hardening is tracked but not yet done.
    """
    try:
        infos = socket.getaddrinfo(host, None)
    except socket.gaierror:
        return False
    for info in infos:
        addr = info[4][0]
        try:
            ip = ipaddress.ip_address(addr)
        except ValueError:
            return False
        if (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_multicast
            or ip.is_reserved
            or ip.is_unspecified
        ):
            return False
    return True


def _port_allowed(parsed) -> bool:
    """True if the URL uses a default port or one of the allowed standard ports.

    `parsed.port` raises ValueError on a malformed port (e.g. ``host:abc``); we
    treat that as disallowed.
    """
    try:
        port = parsed.port
    except ValueError:
        return False
    return port is None or port in ALLOWED_PORTS


def _check_redirect_target(response: httpx.Response) -> None:
    """Event hook: re-validate each redirect Location against the SSRF guard.

    follow_redirects=True alone only checks the original URL. A public URL
    could redirect to 169.254.169.254 (AWS metadata) or an RFC-1918 address,
    bypassing _is_public_address(). This hook fires before httpx follows each
    hop so we can abort the chain early.
    """
    if not response.is_redirect:
        return
    location = response.headers.get("location", "")
    if not location:
        return
    absolute = urljoin(str(response.url), location)
    parsed = urlparse(absolute)
    if parsed.scheme not in ("http", "https"):
        raise HTTPException(
            status_code=400, detail="Redirect to non-HTTP URL blocked"
        )
    if not _port_allowed(parsed):
        raise HTTPException(
            status_code=400, detail="Redirect to a non-standard port blocked"
        )
    if not parsed.hostname or not _is_public_address(parsed.hostname):
        raise HTTPException(
            status_code=400,
            detail="URL redirects to a non-public address",
        )


def _validate_url(url: str) -> str:
    parsed = urlparse(url.strip())
    if parsed.scheme not in ("http", "https"):
        raise HTTPException(
            status_code=400, detail="URL must use http or https"
        )
    if not parsed.hostname:
        raise HTTPException(status_code=400, detail="URL is missing a host")
    if not _port_allowed(parsed):
        raise HTTPException(
            status_code=400, detail="URL must use a standard web port (80 or 443)"
        )
    if not _is_public_address(parsed.hostname):
        raise HTTPException(
            status_code=400,
            detail="URL must resolve to a public address",
        )
    return parsed.geturl()


# Module-level client reuses TCP connections across requests (connection pooling).
# event_hooks re-validates each redirect target against the SSRF guard.
_http_client = httpx.Client(
    timeout=FETCH_TIMEOUT_SECONDS,
    follow_redirects=True,
    max_redirects=MAX_REDIRECTS,
    headers={
        "User-Agent": "Mozilla/5.0 (compatible; Applyd/1.0; +https://applyd.app)",
        "Accept": "text/html,application/xhtml+xml",
    },
    event_hooks={"response": [_check_redirect_target]},
)


def _fetch_text(url: str) -> str:
    # Imported lazily so importing this module (e.g. for the SSRF helpers) does
    # not pull in bs4 unless a fetch actually happens.
    from bs4 import BeautifulSoup

    try:
        with _http_client.stream("GET", url) as resp:
            resp.raise_for_status()
            ctype = resp.headers.get("content-type", "")
            if "html" not in ctype.lower() and "text" not in ctype.lower():
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported content-type: {ctype}",
                )
            chunks: list[bytes] = []
            total = 0
            for chunk in resp.iter_bytes():
                total += len(chunk)
                if total > MAX_BYTES:
                    break
                chunks.append(chunk)
            raw = b"".join(chunks)
    except httpx.HTTPStatusError as exc:
        code = exc.response.status_code
        if code in (401, 403, 429):
            raise HTTPException(
                status_code=400,
                detail=(
                    "This site blocks automated requests "
                    "(LinkedIn, Indeed, Glassdoor, etc.). Try the company's "
                    "direct job page on Greenhouse, Lever, Ashby, or their "
                    "careers site."
                ),
            ) from exc
        # Keep the upstream status out of the client-facing detail (it's a weak
        # SSRF oracle); log it for debugging instead.
        logger.info("fetch failed url=%s upstream_status=%s", url, code)
        raise HTTPException(
            status_code=400, detail="Couldn't fetch that page. Try a direct job posting URL."
        ) from exc
    except httpx.HTTPError as exc:
        # The exception text can carry connection details (host/IP/port); don't
        # surface it to the caller. Log it, return a generic message.
        logger.info("fetch error url=%s err=%s", url, exc)
        raise HTTPException(
            status_code=400, detail="Couldn't fetch that page. Check the URL and try again."
        ) from exc

    soup = BeautifulSoup(raw, "html.parser")
    for tag in soup(["script", "style", "noscript", "header", "footer", "nav"]):
        tag.decompose()
    text = soup.get_text(separator="\n", strip=True)
    if len(text) > MAX_TEXT_CHARS:
        text = text[:MAX_TEXT_CHARS]
    return text


@lru_cache(maxsize=4)
def _genai_client(api_key: str) -> genai.Client:
    """One Gemini client per key, reused across requests (pools connections)."""
    return genai.Client(api_key=api_key)


def _extract_with_gemini(text: str, url: str, api_key: str) -> dict:
    client = _genai_client(api_key)
    user_msg = f"Source URL: {url}\n\nPage text:\n{text}\n\nReturn the JSON now."
    # Gemini 2.5 Flash enables "thinking" by default, which silently consumes
    # max_output_tokens before producing visible text — leading to empty or
    # truncated responses. thinking_budget=0 disables it for this extraction
    # task (no chain-of-thought needed for short structured output).
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=user_msg,
        config=genai_types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            response_mime_type="application/json",
            max_output_tokens=1024,
            thinking_config=genai_types.ThinkingConfig(thinking_budget=0),
        ),
    )
    payload = (response.text or "").strip()
    if not payload:
        logger.warning("Gemini returned empty payload for url=%s", url)
        raise HTTPException(
            status_code=502, detail="Model returned an empty response"
        )
    parsed = _parse_json_object(payload)
    if parsed is None:
        logger.warning(
            "Gemini returned unusable JSON for url=%s payload=%r", url, payload[:500]
        )
        raise HTTPException(
            status_code=502,
            detail="Model returned an unexpected response",
        )
    return parsed


def _parse_json_object(payload: str) -> dict | None:
    """Parse the model reply into a JSON *object*, or None if it isn't one.

    Tries the whole payload, then the first {...} block (the model occasionally
    wraps JSON in prose despite response_mime_type). Returns None for invalid
    JSON *and* for valid-but-non-object JSON — a bare ``null``, list, or string
    would otherwise reach the caller's ``.get()`` and raise an unhandled 500.
    """
    candidates = [payload]
    match = re.search(r"\{.*\}", payload, re.DOTALL)
    if match:
        candidates.append(match.group(0))
    for candidate in candidates:
        try:
            value = json.loads(candidate)
        except json.JSONDecodeError:
            continue
        if isinstance(value, dict):
            return value
    return None


def _coerce(value) -> str | None:
    if value is None:
        return None
    if isinstance(value, str):
        s = value.strip()
        return s or None
    return str(value)


def parse_job(*, url: str | None, text: str | None, api_key: str) -> ParseUrlResponse:
    """Resolve page text from a URL (fetched) or pasted text, then extract
    structured job fields with Gemini.
    """
    if url:
        safe_url = _validate_url(url)
        page_text = _fetch_text(safe_url)
        source_url: str | None = safe_url
    else:
        # Pasted text path — no URL to validate, no network fetch.
        page_text = (text or "").strip()
        if len(page_text) > MAX_TEXT_CHARS:
            page_text = page_text[:MAX_TEXT_CHARS]
        source_url = None

    if not page_text:
        raise HTTPException(
            status_code=400, detail="Could not extract text from input"
        )

    raw = _extract_with_gemini(
        page_text, source_url or "(pasted text)", api_key
    )
    return ParseUrlResponse(
        company=_coerce(raw.get("company")),
        role=_coerce(raw.get("role")),
        location=_coerce(raw.get("location")),
        salary_range=_coerce(raw.get("salary_range")),
        job_url=_coerce(raw.get("job_url")) or source_url,
    )
