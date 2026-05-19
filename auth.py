import streamlit as st
from db import get_client


def _set_session(session, user):
    st.session_state["session"] = session
    st.session_state["user"] = user


def _clear_session():
    for key in ("session", "user", "edit_id"):
        st.session_state.pop(key, None)


def current_user():
    return st.session_state.get("user")


def is_logged_in() -> bool:
    return current_user() is not None


def sign_in(email: str, password: str) -> tuple[bool, str]:
    try:
        client = get_client()
        res = client.auth.sign_in_with_password({"email": email, "password": password})
        if res.user and res.session:
            _set_session(res.session, res.user)
            return True, "Signed in."
        return False, "Invalid credentials."
    except Exception as e:
        return False, f"Sign-in failed: {e}"


def sign_up(email: str, password: str) -> tuple[bool, bool, str]:
    """Returns (success, logged_in, message)."""
    try:
        client = get_client()
        res = client.auth.sign_up({"email": email, "password": password})
        if res.user and res.session:
            _set_session(res.session, res.user)
            return True, True, "Account created. Signing you in…"
        if res.user and not res.session:
            return True, False, "Account created. You can now sign in."
        return False, False, "Could not create account."
    except Exception as e:
        return False, False, f"Sign-up failed: {e}"


def sign_out() -> None:
    try:
        get_client().auth.sign_out()
    except Exception:
        pass
    _clear_session()


def render_login_page():
    st.title("Job Tracker")
    st.caption("Sign in to track your job applications.")

    tab_login, tab_signup = st.tabs(["Sign in", "Create account"])

    with tab_login:
        with st.form("login_form", clear_on_submit=False):
            email = st.text_input("Email", key="login_email")
            password = st.text_input("Password", type="password", key="login_password")
            submitted = st.form_submit_button("Sign in", use_container_width=True)
        if submitted:
            ok, msg = sign_in(email.strip(), password)
            if ok:
                st.success(msg)
                st.rerun()
            else:
                st.error(msg)

    with tab_signup:
        with st.form("signup_form", clear_on_submit=False):
            email = st.text_input("Email", key="signup_email")
            password = st.text_input("Password (min 6 chars)", type="password", key="signup_password")
            submitted = st.form_submit_button("Create account", use_container_width=True)
        if submitted:
            if len(password) < 6:
                st.error("Password must be at least 6 characters.")
            else:
                ok, logged_in, msg = sign_up(email.strip(), password)
                if ok and logged_in:
                    st.success(msg)
                    st.rerun()
                elif ok:
                    st.info(msg)
                else:
                    st.error(msg)
