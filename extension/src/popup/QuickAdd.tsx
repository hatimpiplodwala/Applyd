import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api } from "../lib/api";
import { config } from "../lib/config";
import { STATUSES, type ParsedJob, type Status } from "../lib/types";
import {
  buildExtraction,
  parseResponseToForm,
  fallbackForm,
  type FormState,
  type RawExtraction,
} from "../lib/extract";
import { extractActiveTab } from "../lib/inject";
import { BrandHeader, BrandLoader, BrandMark } from "./Brand";

type Phase = "loading" | "ready" | "saving" | "saved" | "error";

function todayLocal(): string {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

export default function QuickAdd({
  pending,
  onSignedOut,
}: {
  pending: RawExtraction | null;
  onSignedOut: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [form, setForm] = useState<FormState | null>(null);
  const [loadLabel, setLoadLabel] = useState("Reading page…");
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dupWarn, setDupWarn] = useState(false);
  const [earlyDup, setEarlyDup] = useState(false);

  useEffect(() => {
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The parser hits the API, which can cold-start on a free-tier host. Reassure
  // during a slow first hit, and retry once on a transient failure (e.g. a 502
  // while the server spins up) before giving up to manual entry.
  async function parseWithRetry(text: string): Promise<ParsedJob> {
    try {
      return await api.parseJobFromText(text);
    } catch (err) {
      if (err instanceof Error && err.message === "SESSION_EXPIRED") throw err;
      setLoadLabel("Waking up the server…");
      await new Promise((r) => setTimeout(r, 1500));
      return api.parseJobFromText(text);
    }
  }

  async function run() {
    setPhase("loading");
    setNote(null);
    setLoadLabel("Reading page…");
    // A cold start often just hangs rather than erroring; nudge the label so the
    // popup doesn't look frozen.
    const slowTimer = setTimeout(
      () => setLoadLabel("Waking up the server…"),
      4000
    );
    try {
      const raw = pending ?? (await extractActiveTab());
      const extraction = buildExtraction(raw);
      const ctx = {
        jobUrl: extraction.url,
        title: extraction.title,
        today: todayLocal(),
      };
      try {
        const parsed = await parseWithRetry(extraction.text);
        const filled = parseResponseToForm(parsed, ctx);
        setForm(filled);
        // Proactively flag a likely duplicate so the user knows before filling.
        // Non-blocking: the save-time check is the real gate.
        if (filled.company && filled.role) {
          api
            .duplicateCheck(filled.company, filled.role)
            .then(({ exists }) => setEarlyDup(exists))
            .catch(() => {});
        }
      } catch (parseErr) {
        if (parseErr instanceof Error && parseErr.message === "SESSION_EXPIRED") {
          onSignedOut();
          return;
        }
        // Parse failed (rate limit, cold start, empty model output). Open the
        // form anyway with what we know.
        setForm(fallbackForm(ctx));
        setNote("Couldn't auto-fill — please fill in the details.");
      }
      setPhase("ready");
    } catch {
      setError("Couldn't read this page. Open a job posting and try again.");
      setPhase("error");
    } finally {
      clearTimeout(slowTimer);
    }
  }

  async function startManual() {
    setError(null);
    setDupWarn(false);
    setEarlyDup(false);
    let jobUrl = "";
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.url?.startsWith("http")) jobUrl = tab.url;
    } catch {
      // No tab access — leave the URL blank for the user to fill.
    }
    setForm(fallbackForm({ jobUrl, title: "", today: todayLocal() }));
    setNote("Add the job details below.");
    setPhase("ready");
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => {
      if (!f) return f;
      const next = { ...f, [key]: value };
      // Keep the follow-up on/after the application date. Otherwise the date
      // input's `min` would mark an existing follow-up out-of-range, and HTML5
      // validation would silently block the whole form from submitting.
      if (
        key === "date_applied" &&
        next.follow_up_date &&
        next.follow_up_date < next.date_applied
      ) {
        next.follow_up_date = next.date_applied;
      }
      return next;
    });
    if (key === "company" || key === "role") {
      setDupWarn(false);
      setEarlyDup(false);
    }
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setError(null);
    setPhase("saving");
    try {
      if (!dupWarn) {
        const { exists } = await api.duplicateCheck(form.company, form.role);
        if (exists) {
          setDupWarn(true);
          setPhase("ready");
          return;
        }
      }
      await api.createApplication({
        company: form.company,
        role: form.role,
        location: form.location || null,
        status: form.status,
        date_applied: form.date_applied,
        follow_up_date: form.follow_up_date || null,
        job_url: form.job_url || null,
        salary_range: form.salary_range || null,
        notes: form.notes || null,
      });
      setPhase("saved");
    } catch (err) {
      if (err instanceof Error && err.message === "SESSION_EXPIRED") {
        onSignedOut();
        return;
      }
      setError(err instanceof Error ? err.message : "Save failed");
      setPhase("ready");
    }
  }

  if (phase === "loading") return <BrandLoader label={loadLabel} />;
  if (phase === "error")
    return (
      <div className="empty-state">
        <BrandMark size="lg" tone="muted" />
        <div className="empty-copy">
          <span className="brand">Nothing to read here</span>
          <p className="muted">
            Open a job posting in this tab, or just add the details yourself.
          </p>
        </div>
        <button className="btn primary" onClick={() => void startManual()}>
          Add manually
        </button>
        <button type="button" className="link" onClick={() => void run()}>
          Try again
        </button>
      </div>
    );
  if (phase === "saved")
    return (
      <div className="stack center saved">
        <BrandMark size="lg" />
        <div className="brand">Saved</div>
        <a className="btn primary" href={config.dashboardUrl} target="_blank" rel="noreferrer">
          View in Applyd
        </a>
        <button className="btn" onClick={() => void startManual()}>Save another</button>
        <button className="btn" onClick={() => window.close()}>Close</button>
      </div>
    );

  if (!form) return null;

  return (
    <form className="stack" onSubmit={handleSave}>
      <BrandHeader
        subtitle="Save job"
        size="sm"
        right={
          <button type="button" className="link" onClick={onSignedOut}>Sign out</button>
        }
      />
      {note && (
        <div className="note" role="status" aria-live="polite">
          {note}
        </div>
      )}
      {earlyDup && !dupWarn && (
        <div className="note warn" role="status" aria-live="polite">
          Looks like you already saved this one. You can still add it.
        </div>
      )}
      <label className="field">
        <span>Company</span>
        <input value={form.company} onChange={(e) => update("company", e.target.value)} required autoFocus />
      </label>
      <label className="field">
        <span>Role</span>
        <input value={form.role} onChange={(e) => update("role", e.target.value)} required />
      </label>
      <label className="field">
        <span>Status</span>
        <select value={form.status} onChange={(e) => update("status", e.target.value as Status)}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </label>
      <div className="row">
        <label className="field grow">
          <span>Date applied</span>
          <input type="date" value={form.date_applied} onChange={(e) => update("date_applied", e.target.value)} required />
        </label>
        <label className="field grow">
          <span>Follow-up</span>
          <input
            type="date"
            value={form.follow_up_date}
            min={form.date_applied || undefined}
            onChange={(e) => update("follow_up_date", e.target.value)}
          />
        </label>
      </div>
      <label className="field">
        <span>Location</span>
        <input value={form.location} onChange={(e) => update("location", e.target.value)} />
      </label>
      <label className="field">
        <span>Salary range</span>
        <input value={form.salary_range} onChange={(e) => update("salary_range", e.target.value)} />
      </label>
      <label className="field">
        <span>Job URL</span>
        <input value={form.job_url} onChange={(e) => update("job_url", e.target.value)} />
      </label>
      <label className="field">
        <span>Notes</span>
        <textarea value={form.notes} rows={2} onChange={(e) => update("notes", e.target.value)} />
      </label>
      {dupWarn && (
        <div className="note warn" role="status" aria-live="polite">
          You already have an application for this company + role. Save anyway?
        </div>
      )}
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      <button className="btn primary" type="submit" disabled={phase === "saving"}>
        {phase === "saving" ? "Saving…" : dupWarn ? "Save anyway" : "Save to Applyd"}
      </button>
    </form>
  );
}
