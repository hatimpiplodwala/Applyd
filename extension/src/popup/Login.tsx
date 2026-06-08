import { useState } from "react";
import type { FormEvent } from "react";
import { signIn } from "../lib/auth";
import { config } from "../lib/config";
import { BrandMark } from "./Brand";

// The reset flow lives on the web app; link to it (origin from the dashboard URL).
const resetUrl = config.dashboardUrl
  ? new URL("/forgot-password", config.dashboardUrl).href
  : null;

export default function Login({ onSignedIn }: { onSignedIn: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      onSignedIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <div className="login-head">
        <BrandMark size="lg" />
        <span className="brand">Applyd</span>
      </div>
      <p className="muted" style={{ textAlign: "center" }}>Sign in to save jobs.</p>
      <label className="field">
        <span>Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
      </label>
      <label className="field">
        <span>Password</span>
        <div className="input-wrap">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="reveal"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </label>
      {resetUrl && (
        <div style={{ textAlign: "right", marginTop: -4 }}>
          <a className="link" href={resetUrl} target="_blank" rel="noreferrer">
            Forgot password?
          </a>
        </div>
      )}
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      <button className="btn primary" type="submit" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
