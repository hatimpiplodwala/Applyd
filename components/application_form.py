from datetime import date
import streamlit as st
from db import (
    STATUSES,
    insert_application,
    update_application,
    delete_application,
    duplicate_exists,
)
from auth import current_user


def _form_fields(prefix: str, existing: dict | None = None) -> dict:
    existing = existing or {}
    date_val = existing.get("date_applied")
    if isinstance(date_val, str):
        try:
            date_val = date.fromisoformat(date_val)
        except ValueError:
            date_val = date.today()
    elif date_val is None:
        date_val = date.today()

    status_options = STATUSES
    status_default = existing.get("status") or "Applied"
    status_index = status_options.index(status_default) if status_default in status_options else 0

    company = st.text_input("Company *", value=existing.get("company") or "", key=f"{prefix}_company")
    role = st.text_input("Role / Position *", value=existing.get("role") or "", key=f"{prefix}_role")

    c1, c2 = st.columns(2)
    with c1:
        status = st.selectbox("Status *", status_options, index=status_index, key=f"{prefix}_status")
        location = st.text_input("Location", value=existing.get("location") or "", key=f"{prefix}_location")
        salary_range = st.text_input(
            "Salary Range", value=existing.get("salary_range") or "",
            placeholder="e.g. $80k–$100k", key=f"{prefix}_salary",
        )
    with c2:
        date_applied = st.date_input("Date Applied *", value=date_val, key=f"{prefix}_date")
        contact_name = st.text_input(
            "Contact Name", value=existing.get("contact_name") or "",
            placeholder="Recruiter or hiring manager", key=f"{prefix}_contact",
        )
        job_url = st.text_input("Job URL", value=existing.get("job_url") or "", key=f"{prefix}_url")

    notes = st.text_area("Notes", value=existing.get("notes") or "", key=f"{prefix}_notes", height=120)

    return {
        "company": company.strip(),
        "role": role.strip(),
        "location": location.strip() or None,
        "status": status,
        "date_applied": date_applied.isoformat() if isinstance(date_applied, date) else str(date_applied),
        "salary_range": salary_range.strip() or None,
        "contact_name": contact_name.strip() or None,
        "job_url": job_url.strip() or None,
        "notes": notes.strip() or None,
    }


def _validate(payload: dict) -> str | None:
    if not payload["company"]:
        return "Company is required."
    if not payload["role"]:
        return "Role is required."
    if not payload["status"]:
        return "Status is required."
    if not payload["date_applied"]:
        return "Date Applied is required."
    return None


@st.dialog("Add Application")
def add_application_dialog():
    user = current_user()
    if not user:
        st.error("Not signed in.")
        return

    payload = _form_fields(prefix="add")
    force = st.session_state.get("add_force_submit", False)

    submit_col, cancel_col = st.columns(2)
    with submit_col:
        submit = st.button(
            "Save", type="primary", use_container_width=True, key="add_save"
        )
    with cancel_col:
        cancel = st.button("Cancel", use_container_width=True, key="add_cancel")

    if cancel:
        st.session_state.pop("add_force_submit", None)
        st.rerun()

    if submit:
        err = _validate(payload)
        if err:
            st.error(err)
            return

        if not force and duplicate_exists(user.id, payload["company"], payload["role"]):
            st.warning(
                f"You already have an application for **{payload['company']}** — "
                f"**{payload['role']}**. Click Save again to add it anyway."
            )
            st.session_state["add_force_submit"] = True
            return

        try:
            insert_application(user.id, payload)
            st.session_state.pop("add_force_submit", None)
            st.success("Application added.")
            st.rerun()
        except Exception as e:
            st.error(f"Could not save: {e}")


def _close_edit_state(edit_id: str):
    st.session_state.pop("edit_id", None)
    st.session_state.pop(f"confirm_delete_{edit_id}", None)
    st.session_state.pop(f"edit_force_{edit_id}", None)


@st.dialog("Edit Application", width="large")
def edit_application_dialog(row: dict):
    edit_id = row["id"]
    user = current_user()
    if not user:
        st.error("Not signed in.")
        return

    st.caption(f"{row.get('company')} — {row.get('role')}")

    payload = _form_fields(prefix=f"edit_{edit_id}", existing=row)
    confirm_key = f"confirm_delete_{edit_id}"
    force_key = f"edit_force_{edit_id}"

    save_col, cancel_col = st.columns(2)
    with save_col:
        save = st.button("Save", type="primary", key=f"save_{edit_id}", use_container_width=True)
    with cancel_col:
        cancel = st.button("Cancel", key=f"close_{edit_id}", use_container_width=True)

    st.markdown("---")
    if not st.session_state.get(confirm_key):
        if st.button("🗑 Delete this application", key=f"del_{edit_id}", use_container_width=True):
            st.session_state[confirm_key] = True
            st.rerun()
    else:
        st.warning("Are you sure? This cannot be undone.")
        yes_col, no_col = st.columns(2)
        with yes_col:
            confirm = st.button(
                "Yes, delete", type="primary",
                key=f"yes_{edit_id}", use_container_width=True,
            )
        with no_col:
            back = st.button("Keep it", key=f"no_{edit_id}", use_container_width=True)
        if back:
            st.session_state.pop(confirm_key, None)
            st.rerun()
        if confirm:
            try:
                delete_application(edit_id)
                _close_edit_state(edit_id)
                st.rerun()
            except Exception as e:
                st.error(f"Could not delete: {e}")
                return

    if cancel:
        _close_edit_state(edit_id)
        st.rerun()

    if save:
        err = _validate(payload)
        if err:
            st.error(err)
            return

        force = st.session_state.get(force_key, False)
        if not force and duplicate_exists(
            user.id, payload["company"], payload["role"], exclude_id=edit_id
        ):
            st.warning(
                "Another application with the same company and role exists. "
                "Click Save again to keep this update."
            )
            st.session_state[force_key] = True
            return

        try:
            update_application(edit_id, payload)
            _close_edit_state(edit_id)
            st.rerun()
        except Exception as e:
            st.error(f"Could not save: {e}")


def maybe_render_edit_dialog(applications: list[dict]):
    edit_id = st.session_state.get("edit_id")
    if not edit_id:
        return
    row = next((a for a in applications if a["id"] == edit_id), None)
    if not row:
        st.session_state.pop("edit_id", None)
        return
    edit_application_dialog(row)
