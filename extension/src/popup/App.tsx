import { useEffect, useState } from "react";
import Login from "./Login";
import QuickAdd from "./QuickAdd";
import { getSession } from "../lib/auth";
import { BrandLoader } from "./Brand";
import { PENDING_EXTRACTION_KEY } from "../lib/constants";
import type { RawExtraction } from "../lib/extract";

type AuthState = "checking" | "out" | "in";

export default function App() {
  const [auth, setAuth] = useState<AuthState>("checking");
  const [pending, setPending] = useState<RawExtraction | null>(null);

  useEffect(() => {
    void init();
  }, []);

  async function init() {
    // The context-menu path stashes an extraction in session storage. The
    // stash read and the auth check are independent, so run them together.
    const [stash, session] = await Promise.all([
      chrome.storage.session.get(PENDING_EXTRACTION_KEY),
      getSession(),
    ]);
    if (stash[PENDING_EXTRACTION_KEY]) {
      setPending(stash[PENDING_EXTRACTION_KEY] as RawExtraction);
      await chrome.storage.session.remove(PENDING_EXTRACTION_KEY);
    }
    setAuth(session ? "in" : "out");
  }

  if (auth === "checking") return <BrandLoader label="Loading…" />;
  if (auth === "out") return <Login onSignedIn={() => setAuth("in")} />;
  return <QuickAdd pending={pending} onSignedOut={() => setAuth("out")} />;
}
