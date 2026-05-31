import type { Session } from "@supabase/auth-js";
import { authClient } from "./supabase";

const REFRESH_SKEW_SECONDS = 60;

// Pure: decide whether the access token should be refreshed. expires_at is a
// Unix timestamp in SECONDS (Supabase convention).
export function needsRefresh(
  session: { expires_at?: number } | null,
  nowSeconds: number = Math.floor(Date.now() / 1000)
): boolean {
  if (!session || typeof session.expires_at !== "number") return true;
  return session.expires_at - REFRESH_SKEW_SECONDS <= nowSeconds;
}

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await authClient.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
}

export async function signOut(): Promise<void> {
  await authClient.signOut();
}

export async function getSession(): Promise<Session | null> {
  const { data } = await authClient.getSession();
  return data.session;
}

// Returns a valid access token, refreshing on demand. Throws if not logged in
// or the refresh fails (caller should route back to login).
export async function getValidAccessToken(): Promise<string> {
  let session = await getSession();
  if (needsRefresh(session)) {
    const { data, error } = await authClient.refreshSession();
    if (error || !data.session) throw new Error("SESSION_EXPIRED");
    session = data.session;
  }
  if (!session) throw new Error("SESSION_EXPIRED");
  return session.access_token;
}
