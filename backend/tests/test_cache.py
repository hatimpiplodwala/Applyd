"""Unit tests for the shared TTL/LRU cache backing the auth and Supabase-client
caches. Time is monkeypatched so expiry is deterministic and offline.
"""

from __future__ import annotations

import app.cache as cache_mod
from app.cache import TTLCache, hash_token


def test_get_returns_put_value():
    c: TTLCache[int] = TTLCache(ttl_seconds=60, max_entries=8)
    c.put("a", 1)
    assert c.get("a") == 1


def test_missing_key_returns_none():
    c: TTLCache[int] = TTLCache(ttl_seconds=60, max_entries=8)
    assert c.get("nope") is None


def test_entry_expires_after_ttl(monkeypatch):
    now = [1000.0]
    monkeypatch.setattr(cache_mod.time, "monotonic", lambda: now[0])
    c: TTLCache[int] = TTLCache(ttl_seconds=10, max_entries=8)
    c.put("a", 1)
    now[0] += 5
    assert c.get("a") == 1          # still inside the window
    now[0] += 6                     # 11s elapsed > 10s ttl
    assert c.get("a") is None       # expired and evicted


def test_lru_eviction_drops_least_recently_used():
    c: TTLCache[int] = TTLCache(ttl_seconds=60, max_entries=2)
    c.put("a", 1)
    c.put("b", 2)
    c.get("a")        # touch 'a' so 'b' is now least-recently-used
    c.put("c", 3)     # over capacity -> evict 'b'
    assert c.get("a") == 1
    assert c.get("b") is None
    assert c.get("c") == 3


def test_hash_token_is_stable_hex_and_not_the_token():
    h = hash_token("tok")
    assert h == hash_token("tok")
    assert len(h) == 64
    assert h != "tok"
