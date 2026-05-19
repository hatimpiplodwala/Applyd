import io
import pandas as pd
import streamlit as st
from db import STATUSES

STATUS_BADGE = {
    "Applied":      ("#1E40AF", "#DBEAFE"),
    "Phone Screen": ("#92400E", "#FEF3C7"),
    "Interview":    ("#5B21B6", "#EDE9FE"),
    "Offer":        ("#065F46", "#D1FAE5"),
    "Rejected":     ("#991B1B", "#FEE2E2"),
    "Withdrawn":    ("#374151", "#E5E7EB"),
}

NOTES_TRUNCATE = 80


def _badge_html(status: str) -> str:
    bg, fg = STATUS_BADGE.get(status, ("#374151", "#E5E7EB"))
    return (
        f'<span style="background:{bg};color:{fg};padding:3px 10px;'
        f'border-radius:999px;font-size:0.78rem;font-weight:600;'
        f'white-space:nowrap;">{status}</span>'
    )


def _truncate(text, limit=NOTES_TRUNCATE):
    if not text:
        return ""
    text = str(text).replace("\n", " ").strip()
    return text if len(text) <= limit else text[: limit - 1] + "…"


def _url_cell(url: str) -> str:
    if not url:
        return ""
    return f'<a href="{url}" target="_blank">link</a>'


def _filter(applications: list[dict], status: str, search: str) -> list[dict]:
    out = applications
    if status and status != "All":
        out = [a for a in out if a.get("status") == status]
    if search:
        s = search.lower().strip()
        out = [
            a for a in out
            if s in (a.get("company") or "").lower()
            or s in (a.get("role") or "").lower()
        ]
    return out


def _build_csv(applications: list[dict]) -> bytes:
    if not applications:
        return b""
    df = pd.DataFrame(applications)
    keep = [
        "company", "role", "location", "status", "date_applied",
        "salary_range", "contact_name", "job_url", "notes",
        "created_at", "updated_at",
    ]
    df = df[[c for c in keep if c in df.columns]]
    buf = io.StringIO()
    df.to_csv(buf, index=False)
    return buf.getvalue().encode("utf-8")


def render_applications_table(applications: list[dict]):
    st.markdown("#### Your applications")

    fcol1, fcol2, fcol3 = st.columns([2, 3, 2])
    with fcol1:
        status_filter = st.selectbox(
            "Status", ["All", *STATUSES], key="filter_status", label_visibility="collapsed"
        )
    with fcol2:
        search = st.text_input(
            "Search", placeholder="Search company or role…",
            key="filter_search", label_visibility="collapsed",
        )
    with fcol3:
        csv_bytes = _build_csv(applications)
        st.download_button(
            "Download CSV",
            data=csv_bytes,
            file_name="applications.csv",
            mime="text/csv",
            disabled=len(applications) == 0,
            use_container_width=True,
        )

    rows = _filter(applications, status_filter, search)

    if not rows:
        st.info("No applications match your filters. Click **+ Add Application** to create one.")
        return

    col_widths = [1.8, 1.8, 1.3, 1.1, 1.3, 1.3, 0.6, 2.4, 1.1]
    headers = ["Company", "Role", "Status", "Date", "Salary", "Contact", "Link", "Notes", ""]
    header_cols = st.columns(col_widths)
    for col, h in zip(header_cols, headers):
        col.markdown(f"**{h}**")
    st.markdown(
        "<hr style='margin:0.2rem 0 0.5rem 0;border-color:#2A2F3E;'/>",
        unsafe_allow_html=True,
    )

    for row in rows:
        cols = st.columns(col_widths)
        cols[0].write(row.get("company") or "")
        cols[1].write(row.get("role") or "")
        cols[2].markdown(_badge_html(row.get("status") or ""), unsafe_allow_html=True)
        cols[3].write(str(row.get("date_applied") or ""))
        cols[4].write(row.get("salary_range") or "")
        cols[5].write(row.get("contact_name") or "")
        cols[6].markdown(_url_cell(row.get("job_url") or ""), unsafe_allow_html=True)
        cols[7].write(_truncate(row.get("notes")))
        if cols[8].button("Edit", key=f"edit_{row['id']}", use_container_width=True):
            st.session_state["edit_id"] = row["id"]
            st.rerun()
