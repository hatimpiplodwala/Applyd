"""A small thread-safe, bounded, TTL'd LRU cache.

Used to memoize per-token work — auth lookups (app.deps) and Supabase clients
(app.supabase_client) — so repeated requests carrying the same bearer token skip
redundant network round-trips. Callers hash the token with ``hash_token`` before
using it as a key, so raw tokens never sit in memory.
"""

from __future__ import annotations

import hashlib
import time
from collections import OrderedDict
from threading import Lock
from typing import Generic, TypeVar

_V = TypeVar("_V")


def hash_token(token: str) -> str:
    """SHA-256 hex of a token, for use as a cache key without storing the token."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


class TTLCache(Generic[_V]):
    """Bounded LRU cache whose entries expire after ``ttl_seconds``.

    Thread-safe; O(1) get/put with least-recently-used eviction once
    ``max_entries`` is exceeded.
    """

    def __init__(self, *, ttl_seconds: float, max_entries: int) -> None:
        self._ttl = ttl_seconds
        self._max = max_entries
        self._store: "OrderedDict[str, tuple[float, _V]]" = OrderedDict()
        self._lock = Lock()

    def get(self, key: str) -> _V | None:
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            expires_at, value = entry
            if expires_at <= time.monotonic():
                del self._store[key]
                return None
            self._store.move_to_end(key)
            return value

    def put(self, key: str, value: _V) -> None:
        with self._lock:
            self._store[key] = (time.monotonic() + self._ttl, value)
            self._store.move_to_end(key)
            if len(self._store) > self._max:
                self._store.popitem(last=False)  # evict least-recently-used
