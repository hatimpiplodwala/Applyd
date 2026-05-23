from __future__ import annotations

import ipaddress
import json
import logging
import re
import socket
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup
from fastapi import APIRouter, Depends, HTTPException, status
from google import genai
from google.genai import types as genai_types
from pydantic import BaseModel, Field, model_validator

from app.config import get_settings
from app.deps import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/applications", tags=["applications"])

# Bound the fetch so a malicious URL can't tie up the worker or blow memory.
FETCH_TIMEOUT_SECONDS = 8.0
MAX_BYTES = 1_500_000  # ~1.5MB raw HTML
MAX_TEXT_CHARS = 18_000  # truncate before sending to the LLM

GEMINI_MODEL = "gemini-2.5-flash"


MAX_PASTED_TEXT_CHARS = 50_000


class ParseRequest(BaseModel):
    url: str | None = Field(default=None, max_length=2048)
    text: str | None = Field(default=None, max_length=MAX_PASTED_TEXT_CHARS)

    @model_validator(mode="after")
    def _one_of(self) -> "ParseRequest":
        has_url = bool(self.url and self.url.strip())
        has_text = bool(self.text and self.text.strip())
        if has_url == has_text:  # both or neither
            raise ValueError("Provide exactly one of url or text")
        return self


class ParseUrlResponse(BaseModel):
    company: str | None = None
    role: str | None = None
    location: str | None = None
    salary_range: str | None = None
    job_url: str | None = None


def _is_public_address(host: str) -> bool:
    """Reject hostnames that resolve to loopback / private / link-local IPs.

    Defends against SSRF where the URL points to internal services
    (cloud metadata, internal admin UIs, RFC1918 subnets).
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


def _validate_url(url: str) -> str:
    parsed = urlparse(url.strip())
    if parsed.scheme not in ("http", "https"):
        raise HTTPException(
            status_code=400, detail="URL must use http or https"
        )
    if not parsed.hostname:
        raise HTTPException(status_code=400, detail="URL is missing a host")
    if not _is_public_address(parsed.hostname):
        raise HTTPException(
            status_code=400,
            detail="URL must resolve to a public address",
        )
    return parsed.geturl()


def _fetch_text(url: str) -> str:
    headers = {
        # Some job boards block default httpx UA outright.
        "User-Agent": (
            "Mozilla/5.0 (compatible; Applyd/1.0; +https://applyd.app)"
        ),
        "Accept": "text/html,application/xhtml+xml",
    }
    try:
        with httpx.Client(
            timeout=FETCH_TIMEOUT_SECONDS,
            follow_redirects=True,
            headers=headers,
        ) as client:
            with client.stream("GET", url) as resp:
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
        raise HTTPException(
            status_code=400, detail=f"Failed to fetch URL (HTTP {code})"
        ) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=400, detail=f"Failed to fetch URL: {exc}"
        ) from exc

    soup = BeautifulSoup(raw, "html.parser")
    for tag in soup(["script", "style", "noscript", "header", "footer", "nav"]):
        tag.decompose()
    text = soup.get_text(separator="\n", strip=True)
    if len(text) > MAX_TEXT_CHARS:
        text = text[:MAX_TEXT_CHARS]
    return text


SYSTEM_PROMPT = (
    "You extract structured job application data from job-posting page text. "
    "Reply ONLY with a JSON object — no prose, no markdown fences. "
    "Schema: {company, role, location, salary_range, job_url}. "
    "Use null for any field you cannot confidently extract. "
    "Do not invent values. salary_range should be a short string like "
    '"$120k-$150k" when present, otherwise null.'
)


def _extract_with_gemini(text: str, url: str, api_key: str) -> dict:
    client = genai.Client(api_key=api_key)
    user_msg = (
        f"Source URL: {url}\n\n"
        f"Page text:\n{text}\n\n"
        "Return the JSON now."
    )
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
    try:
        return json.loads(payload)
    except json.JSONDecodeError:
        # Fallback: try to extract the first {...} block in case the model
        # wrapped the JSON in prose (shouldn't happen with response_mime_type
        # set, but Gemini occasionally drifts on edge cases like login walls).
        match = re.search(r"\{.*\}", payload, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass
        logger.warning(
            "Gemini returned non-JSON for url=%s payload=%r", url, payload[:500]
        )
        raise HTTPException(
            status_code=502,
            detail="Model returned non-JSON response",
        )


def _coerce(value) -> str | None:
    if value is None:
        return None
    if isinstance(value, str):
        s = value.strip()
        return s or None
    return str(value)


@router.post("/parse-url", response_model=ParseUrlResponse)
def parse(
    payload: ParseRequest,
    _user=Depends(get_current_user),
) -> ParseUrlResponse:
    settings = get_settings()
    if not settings.gemini_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI parsing is not configured on this server",
        )

    if payload.url:
        safe_url = _validate_url(payload.url)
        page_text = _fetch_text(safe_url)
        source_url: str | None = safe_url
    else:
        # Pasted text path — no URL to validate, no network fetch.
        page_text = (payload.text or "").strip()
        if len(page_text) > MAX_TEXT_CHARS:
            page_text = page_text[:MAX_TEXT_CHARS]
        source_url = None

    if not page_text:
        raise HTTPException(
            status_code=400, detail="Could not extract text from input"
        )

    raw = _extract_with_gemini(
        page_text, source_url or "(pasted text)", settings.gemini_api_key
    )
    return ParseUrlResponse(
        company=_coerce(raw.get("company")),
        role=_coerce(raw.get("role")),
        location=_coerce(raw.get("location")),
        salary_range=_coerce(raw.get("salary_range")),
        job_url=_coerce(raw.get("job_url")) or source_url,
    )
