import hashlib
import logging
import time
from collections import OrderedDict
from dataclasses import dataclass
from threading import Lock

from fastapi import Depends, Header, HTTPException, status
from gotrue.errors import AuthApiError

from app.supabase_client import get_user_client

logger = logging.getLogger(__name__)


@dataclass
class CurrentUser:
    id: str
    email: str | None
    access_token: str


# In-process cache for Supabase auth.get_user results. Avoids a network
# round-trip to Supabase Auth on every request. An OrderedDict gives O(1)
# LRU eviction; entries expire after CACHE_TTL_SECONDS so a logged-out token
# stops working within the TTL window.
CACHE_TTL_SECONDS = 60
CACHE_MAX_ENTRIES = 1024
_cache: "OrderedDict[str, tuple[float, CurrentUser]]" = OrderedDict()
_cache_lock = Lock()


def _token_key(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _cache_get(token: str) -> CurrentUser | None:
    key = _token_key(token)
    with _cache_lock:
        entry = _cache.get(key)
        if entry is None:
            return None
        expires_at, user = entry
        if expires_at < time.monotonic():
            del _cache[key]
            return None
        _cache.move_to_end(key)
        return user


def _cache_put(token: str, user: CurrentUser) -> None:
    key = _token_key(token)
    with _cache_lock:
        _cache[key] = (time.monotonic() + CACHE_TTL_SECONDS, user)
        _cache.move_to_end(key)
        if len(_cache) > CACHE_MAX_ENTRIES:
            _cache.popitem(last=False)  # evict least-recently-used


def get_current_user(
    authorization: str | None = Header(default=None),
) -> CurrentUser:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
        )

    token = authorization.split(" ", 1)[1].strip()

    cached = _cache_get(token)
    if cached is not None:
        return cached

    client = get_user_client(token)
    try:
        result = client.auth.get_user(token)
    except AuthApiError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        ) from exc
    except Exception as exc:
        logger.exception("Unexpected error during token validation: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication service error",
        ) from exc

    user = getattr(result, "user", None)
    if user is None or not getattr(user, "id", None):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    current = CurrentUser(
        id=user.id,
        email=getattr(user, "email", None),
        access_token=token,
    )
    _cache_put(token, current)
    return current


def get_db(user: CurrentUser = Depends(get_current_user)):
    return get_user_client(user.access_token), user
