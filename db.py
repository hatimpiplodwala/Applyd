import os
from typing import Optional
import streamlit as st
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

STATUSES = ["Applied", "Phone Screen", "Interview", "Offer", "Rejected", "Withdrawn"]
ACTIVE_STATUSES = {"Applied", "Phone Screen", "Interview"}


def _get_secret(key: str) -> Optional[str]:
    val = os.getenv(key)
    if val:
        return val
    try:
        return st.secrets[key]
    except Exception:
        return None


@st.cache_resource
def get_client() -> Client:
    url = _get_secret("SUPABASE_URL")
    key = _get_secret("SUPABASE_KEY")
    if not url or not key:
        raise RuntimeError(
            "Missing SUPABASE_URL or SUPABASE_KEY. Set them in .env or Streamlit secrets."
        )
    return create_client(url, key)


def _user_client() -> Client:
    client = get_client()
    session = st.session_state.get("session")
    if session:
        client.postgrest.auth(session.access_token)
    return client


def list_applications(user_id: str) -> list[dict]:
    res = (
        _user_client()
        .table("applications")
        .select("*")
        .eq("user_id", user_id)
        .order("date_applied", desc=True)
        .execute()
    )
    return res.data or []


def insert_application(user_id: str, payload: dict) -> dict:
    payload = {**payload, "user_id": user_id}
    res = _user_client().table("applications").insert(payload).execute()
    return (res.data or [None])[0]


def update_application(app_id: str, payload: dict) -> dict:
    res = (
        _user_client()
        .table("applications")
        .update(payload)
        .eq("id", app_id)
        .execute()
    )
    return (res.data or [None])[0]


def delete_application(app_id: str) -> None:
    _user_client().table("applications").delete().eq("id", app_id).execute()


def duplicate_exists(user_id: str, company: str, role: str, exclude_id: Optional[str] = None) -> bool:
    q = (
        _user_client()
        .table("applications")
        .select("id")
        .eq("user_id", user_id)
        .ilike("company", company.strip())
        .ilike("role", role.strip())
    )
    res = q.execute()
    rows = res.data or []
    if exclude_id:
        rows = [r for r in rows if r["id"] != exclude_id]
    return len(rows) > 0
