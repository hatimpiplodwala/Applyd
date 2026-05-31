"""Shared fixtures for the API integration tests.

Env vars are set *before* importing the app, because app.config.Settings reads
them at construction time and main.py builds Settings at import. Supabase and
the auth layer are replaced via FastAPI dependency overrides, so these tests
make no network calls and need no real credentials.
"""

from __future__ import annotations

import os

os.environ.setdefault("SUPABASE_URL", "http://test.local")
os.environ.setdefault("SUPABASE_ANON_KEY", "test-anon-key")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:3000")
# Force the "AI not configured" default unless a test opts in by monkeypatching.
os.environ.pop("GEMINI_API_KEY", None)

import pytest
from fastapi.testclient import TestClient

from app.deps import CurrentUser, get_current_user, get_db
from main import app


# --- fake Supabase client ----------------------------------------------------

class FakeResult:
    def __init__(self, data):
        self.data = data


class FakeQuery:
    """Chainable PostgREST stand-in: every builder method returns self, and
    execute() yields whatever the test configured on the client."""

    def __init__(self, result: FakeResult):
        self._result = result

    def execute(self):
        return self._result

    def __getattr__(self, _name):
        def chain(*_args, **_kwargs):
            return self

        return chain


class FakeClient:
    def __init__(self):
        self._result = FakeResult([])
        self.tables: list[str] = []

    def set_data(self, data):
        self._result = FakeResult(data)

    def table(self, name: str) -> FakeQuery:
        self.tables.append(name)
        return FakeQuery(self._result)


def make_row(**overrides):
    """A complete `applications` row that satisfies the Application response_model."""
    row = {
        "id": "app-1",
        "user_id": "user-1",
        "company": "Acme",
        "role": "Engineer",
        "location": "Remote",
        "status": "Applied",
        "date_applied": "2026-05-29",
        "job_url": "https://acme.com/jobs/1",
        "salary_range": "$120k-$150k",
        "contact_name": None,
        "notes": None,
        "follow_up_date": None,
        "created_at": "2026-05-29T00:00:00Z",
        "updated_at": "2026-05-29T00:00:00Z",
    }
    row.update(overrides)
    return row


# --- fixtures ----------------------------------------------------------------

@pytest.fixture
def fake_db() -> FakeClient:
    return FakeClient()


@pytest.fixture
def user() -> CurrentUser:
    return CurrentUser(id="user-1", email="user@example.com", access_token="tok")


@pytest.fixture
def client(fake_db, user):
    """TestClient with auth + DB dependencies overridden to the fakes."""
    app.dependency_overrides[get_db] = lambda: (fake_db, user)
    app.dependency_overrides[get_current_user] = lambda: user
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def noauth_client():
    """TestClient with no overrides, so the real auth dependency runs."""
    app.dependency_overrides.clear()
    with TestClient(app) as c:
        yield c
