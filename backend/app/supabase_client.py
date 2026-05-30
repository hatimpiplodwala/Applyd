import hashlib
import time
from collections import OrderedDict
from threading import Lock

from supabase import Client, create_client

from app.config import get_settings

# Building a Supabase client is expensive: it spins up fresh HTTP connection
# pools, so creating one per request means a new TLS handshake to PostgREST on
# every call. We cache one client per access token and reuse it (and its
# keep-alive connections) for a short window. Keyed by a hash of the token so
# raw tokens never sit in memory; bounded + TTL'd so it can't grow unbounded
# and a rotated token's client is dropped.
_CACHE_TTL_SECONDS = 300
_CACHE_MAX_ENTRIES = 512
_clients: "OrderedDict[str, tuple[float, Client]]" = OrderedDict()
_clients_lock = Lock()


def _token_key(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _build_client(access_token: str) -> Client:
    settings = get_settings()
    client = create_client(settings.supabase_url, settings.supabase_anon_key)
    client.postgrest.auth(access_token)
    return client


def get_user_client(access_token: str) -> Client:
    """Return a Supabase client scoped to the user's JWT so RLS applies.

    Clients are cached per token so repeated requests reuse the same
    connection pool instead of opening fresh connections each time.
    """
    key = _token_key(access_token)
    now = time.monotonic()
    with _clients_lock:
        entry = _clients.get(key)
        if entry is not None:
            expires_at, client = entry
            if expires_at > now:
                _clients.move_to_end(key)
                return client
            del _clients[key]

        client = _build_client(access_token)
        _clients[key] = (now + _CACHE_TTL_SECONDS, client)
        _clients.move_to_end(key)
        if len(_clients) > _CACHE_MAX_ENTRIES:
            _clients.popitem(last=False)  # evict least-recently-used
        return client
