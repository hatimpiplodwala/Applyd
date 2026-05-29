import { useEffect, useState } from "react";
import Login from "./Login";
import QuickAdd from "./QuickAdd";
import { getSession } from "../lib/auth";
import { BrandLoader } from "./Brand";
import type { RawExtraction } from "../lib/extract";

const PENDING_KEY = "pendingExtraction";

type AuthState = "checking" | "out" | "in";

export default function App() {
  const [auth, setAuth] = useState<AuthState>("checking");
  const [pending, setPending] = useState<RawExtraction | null>(null);

  useEffect(() => {
    void init();
  }, []);

  async function init() {
    // The context-menu path stashes an extraction in session storage.
    const stash = await chrome.storage.session.get(PENDING_KEY);
    if (stash[PENDING_KEY]) {
      setPending(stash[PENDING_KEY] as RawExtraction);
      await chrome.storage.session.remove(PENDING_KEY);
    }
    const session = await getSession();
    setAuth(session ? "in" : "out");
  }

  if (auth === "checking") return <BrandLoader label="Loading…" />;
  if (auth === "out") return <Login onSignedIn={() => setAuth("in")} />;
  return <QuickAdd pending={pending} onSignedOut={() => setAuth("out")} />;
}
