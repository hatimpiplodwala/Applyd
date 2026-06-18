from supabase import Client, create_client

from app.cache import TTLCache, hash_token
from app.config import get_settings

# Building a Supabase client is expensive: it spins up fresh HTTP connection
# pools, so creating one per request means a new TLS handshake to PostgREST on
# every call. We cache one client per access token and reuse it (and its
# keep-alive connections) for a short window. Keyed by a hash of the token so
# raw tokens never sit in memory; bounded + TTL'd so it can't grow unbounded
# and a rotated token's client is dropped.
_clients: TTLCache[Client] = TTLCache(ttl_seconds=300, max_entries=512)


def _build_client(access_token: str) -> Client:
    settings = get_settings()
    client = create_client(settings.supabase_url, settings.supabase_anon_key)
    client.postgrest.auth(access_token)
    return client


def get_user_client(access_token: str) -> Client:
    """Return a Supabase client scoped to the user's JWT so RLS applies.

    Clients are cached per token so repeated requests reuse the same connection
    pool instead of opening fresh connections each time. A rare duplicate build
    under concurrent first-use is harmless — one wins the cache, the other is
    used once and dropped.
    """
    key = hash_token(access_token)
    client = _clients.get(key)
    if client is None:
        client = _build_client(access_token)
        _clients.put(key, client)
    return client
