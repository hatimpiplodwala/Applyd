import { GoTrueClient } from "@supabase/auth-js";
import { config } from "./config";
import { chromeStorageAdapter } from "./storage";

// The extension only needs auth, so we use GoTrue directly instead of the full
// @supabase/supabase-js (which also bundles the postgrest/realtime/storage/
// functions clients we never call). We replicate exactly how supabase-js wires
// up its auth client so existing sessions keep working after the swap:
//   - url:        <SUPABASE_URL>/auth/v1
//   - headers:    apikey + Bearer anon key
//   - storageKey: sb-<project-ref>-auth-token  — must match supabase-js's
//     computed key, or already-signed-in users would be logged out on update.
const projectRef = new URL(config.supabaseUrl).hostname.split(".")[0];

// autoRefreshToken is off: popup/SW are ephemeral so timer-based refresh is
// unreliable. We refresh on demand in auth.ts before each API call.
// detectSessionInUrl is off: there's no redirect URL in an extension popup.
export const authClient = new GoTrueClient({
  url: new URL("auth/v1", config.supabaseUrl).href,
  headers: {
    apikey: config.supabaseAnonKey,
    Authorization: `Bearer ${config.supabaseAnonKey}`,
  },
  storageKey: `sb-${projectRef}-auth-token`,
  storage: chromeStorageAdapter,
  persistSession: true,
  autoRefreshToken: false,
  detectSessionInUrl: false,
});
