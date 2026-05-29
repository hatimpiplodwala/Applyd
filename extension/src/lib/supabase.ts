import { createClient } from "@supabase/supabase-js";
import { config } from "./config";
import { chromeStorageAdapter } from "./storage";

// autoRefreshToken is off: popup/SW are ephemeral so timer-based refresh is
// unreliable. We refresh on demand in auth.ts before each API call.
// detectSessionInUrl is off: there's no redirect URL in an extension popup.
export const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
  auth: {
    storage: chromeStorageAdapter,
    persistSession: true,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
