"""Integration tests for the FastAPI routers via TestClient.

Auth + Supabase are mocked at the dependency boundary (see conftest), so these
exercise routing, request validation, status codes, and response shaping —
not the database itself.
"""

from __future__ import annotations

from types import SimpleNamespace

from app.limiter import limiter
from app.schemas import ParseUrlResponse
from tests.conftest import make_row

VALID_CREATE = {
    "company": "Acme",
    "role": "Engineer",
    "date_applied": "2026-05-29",
    "job_url": "https://acme.com/jobs/1",
}


# --- health ------------------------------------------------------------------

def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


# --- auth boundary -----------------------------------------------------------

def test_missing_authorization_header_is_401(noauth_client):
    res = noauth_client.get("/applications")
    assert res.status_code == 401


def test_non_bearer_scheme_is_401(noauth_client):
    res = noauth_client.get("/applications", headers={"Authorization": "Basic abc"})
    assert res.status_code == 401


# --- list --------------------------------------------------------------------

def test_list_applications_returns_rows(client, fake_db):
    fake_db.set_data([make_row(), make_row(id="app-2", company="Globex")])
    res = client.get("/applications")
    assert res.status_code == 200
    body = res.json()
    assert len(body) == 2
    assert body[1]["company"] == "Globex"


def test_list_empty(client, fake_db):
    fake_db.set_data([])
    res = client.get("/applications")
    assert res.status_code == 200
    assert res.json() == []


def test_list_rejects_out_of_range_pagination(client):
    assert client.get("/applications", params={"limit": 0}).status_code == 422
    assert client.get("/applications", params={"limit": 1001}).status_code == 422
    assert client.get("/applications", params={"offset": -1}).status_code == 422


# --- create ------------------------------------------------------------------

def test_create_application_201(client, fake_db):
    fake_db.set_data([make_row()])
    res = client.post("/applications", json=VALID_CREATE)
    assert res.status_code == 201
    body = res.json()
    assert body["company"] == "Acme"
    assert body["user_id"] == "user-1"


def test_create_missing_required_field_is_422(client):
    payload = {k: v for k, v in VALID_CREATE.items() if k != "company"}
    assert client.post("/applications", json=payload).status_code == 422


def test_create_rejects_non_http_job_url(client):
    payload = {**VALID_CREATE, "job_url": "ftp://acme.com/1"}
    assert client.post("/applications", json=payload).status_code == 422


def test_create_rejects_overlong_company(client):
    payload = {**VALID_CREATE, "company": "x" * 201}
    assert client.post("/applications", json=payload).status_code == 422


def test_create_returns_500_when_insert_yields_no_row(client, fake_db):
    fake_db.set_data([])
    assert client.post("/applications", json=VALID_CREATE).status_code == 500


# --- update ------------------------------------------------------------------

def test_update_application_200(client, fake_db):
    fake_db.set_data([make_row(status="Offer")])
    res = client.patch("/applications/app-1", json={"status": "Offer"})
    assert res.status_code == 200
    assert res.json()["status"] == "Offer"


def test_update_empty_body_is_400(client, fake_db):
    fake_db.set_data([make_row()])
    res = client.patch("/applications/app-1", json={})
    assert res.status_code == 400


def test_update_missing_row_is_404(client, fake_db):
    fake_db.set_data([])
    res = client.patch("/applications/nope", json={"status": "Offer"})
    assert res.status_code == 404


def test_update_rejects_invalid_status(client):
    res = client.patch("/applications/app-1", json={"status": "Ghosted"})
    assert res.status_code == 422


# --- delete ------------------------------------------------------------------

def test_delete_application_204(client, fake_db):
    fake_db.set_data([make_row()])
    res = client.delete("/applications/app-1")
    assert res.status_code == 204
    assert res.content == b""


def test_delete_missing_row_is_404(client, fake_db):
    fake_db.set_data([])
    assert client.delete("/applications/nope").status_code == 404


# --- duplicate-check ---------------------------------------------------------

def test_duplicate_check_true(client, fake_db):
    fake_db.set_data([{"id": "app-1"}])
    res = client.get(
        "/applications/duplicate-check", params={"company": "Acme", "role": "Engineer"}
    )
    assert res.status_code == 200
    assert res.json() == {"exists": True}


def test_duplicate_check_false(client, fake_db):
    fake_db.set_data([])
    res = client.get(
        "/applications/duplicate-check", params={"company": "Acme", "role": "Engineer"}
    )
    assert res.status_code == 200
    assert res.json() == {"exists": False}


def test_duplicate_check_requires_company_and_role(client):
    assert (
        client.get("/applications/duplicate-check", params={"company": "Acme"}).status_code
        == 422
    )


# --- parse-url ---------------------------------------------------------------

def test_parse_url_503_when_not_configured(client, monkeypatch):
    # Empty gemini_api_key -> AI parsing disabled, regardless of local .env.
    monkeypatch.setattr(
        "app.routers.parse.get_settings",
        lambda: SimpleNamespace(gemini_api_key=""),
    )
    res = client.post("/applications/parse-url", json={"url": "https://acme.com/jobs/1"})
    assert res.status_code == 503


def test_parse_url_rejects_both_url_and_text(client):
    res = client.post(
        "/applications/parse-url", json={"url": "https://x.com", "text": "hello"}
    )
    assert res.status_code == 422


def test_parse_url_rejects_neither_url_nor_text(client):
    assert client.post("/applications/parse-url", json={}).status_code == 422


def test_parse_url_success_when_configured(client, monkeypatch):
    monkeypatch.setattr(
        "app.routers.parse.get_settings",
        lambda: SimpleNamespace(gemini_api_key="fake-key"),
    )
    monkeypatch.setattr(
        "app.routers.parse.parse_job",
        lambda **_kw: ParseUrlResponse(company="Acme", role="Engineer"),
    )
    res = client.post("/applications/parse-url", json={"text": "We are hiring"})
    assert res.status_code == 200
    assert res.json()["company"] == "Acme"


def test_parse_url_is_rate_limited(client, monkeypatch):
    # Clear any budget consumed by earlier parse-url tests in this process.
    limiter._storage.reset()
    monkeypatch.setattr(
        "app.routers.parse.get_settings",
        lambda: SimpleNamespace(gemini_api_key="fake-key"),
    )
    monkeypatch.setattr(
        "app.routers.parse.parse_job",
        lambda **_kw: ParseUrlResponse(company="Acme"),
    )
    statuses = [
        client.post("/applications/parse-url", json={"text": "hi"}).status_code
        for _ in range(11)
    ]
    # The route is capped at 10/minute; the 11th call is throttled.
    assert statuses[:10] == [200] * 10
    assert statuses[10] == 429
