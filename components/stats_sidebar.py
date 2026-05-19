import streamlit as st
from db import ACTIVE_STATUSES
from auth import current_user, sign_out


def render_stats_sidebar(applications: list[dict]):
    user = current_user()
    with st.sidebar:
        st.markdown("### Job Tracker")
        if user:
            st.caption(user.email)
        st.divider()

        total = len(applications)
        active = sum(1 for a in applications if a.get("status") in ACTIVE_STATUSES)

        col1, col2 = st.columns(2)
        with col1:
            st.metric("Total", total)
        with col2:
            st.metric("Active", active)

        st.divider()
        if st.button("Logout", use_container_width=True):
            sign_out()
            st.rerun()
