import logging
from dataclasses import dataclass

from fastapi import Depends, Header, HTTPException, status
from gotrue.errors import AuthApiError

from app.cache import TTLCache, hash_token
from app.supabase_client import get_user_client

logger = logging.getLogger(__name__)


@dataclass
class CurrentUser:
    id: str
    email: str | None
    access_token: str


# In-process cache for Supabase auth.get_user results so we don't round-trip to
# Supabase Auth on every request. TTL'd so a logged-out token stops working
# within the window; keyed by a hash of the token so raw tokens never sit in
# memory.
_users: TTLCache[CurrentUser] = TTLCache(ttl_seconds=60, max_entries=1024)


def get_current_user(
    authorization: str | None = Header(default=None),
) -> CurrentUser:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
        )

    token = authorization.split(" ", 1)[1].strip()
    key = hash_token(token)

    cached = _users.get(key)
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
    _users.put(key, current)
    return current


def get_db(user: CurrentUser = Depends(get_current_user)):
    return get_user_client(user.access_token), user
