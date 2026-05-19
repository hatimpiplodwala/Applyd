import streamlit as st

from auth import render_login_page, is_logged_in, current_user
from db import list_applications
from components.stats_sidebar import render_stats_sidebar
from components.applications_table import render_applications_table
from components.application_form import add_application_dialog, maybe_render_edit_dialog


st.set_page_config(
    page_title="Job Tracker",
    page_icon="📋",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown(
    """
    <style>
      section[data-testid="stSidebar"] {
        width: 220px !important;
        min-width: 220px !important;
      }
      section[data-testid="stSidebar"] > div {
        width: 220px !important;
        min-width: 220px !important;
      }
    </style>
    """,
    unsafe_allow_html=True,
)


def _load_applications(user_id: str) -> list[dict] | None:
    try:
        return list_applications(user_id)
    except Exception as e:
        st.error(f"Could not load applications: {e}")
        if st.button("Retry"):
            st.rerun()
        return None


def render_dashboard():
    user = current_user()
    apps = _load_applications(user.id)
    if apps is None:
        return

    render_stats_sidebar(apps)

    header_left, header_right = st.columns([4, 1])
    with header_left:
        st.markdown("## Applications")
    with header_right:
        if st.button("+ Add Application", type="primary", use_container_width=True):
            add_application_dialog()

    render_applications_table(apps)
    maybe_render_edit_dialog(apps)


def main():
    if not is_logged_in():
        render_login_page()
        return
    render_dashboard()


if __name__ == "__main__":
    main()
