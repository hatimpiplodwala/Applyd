import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api } from "../lib/api";
import { config } from "../lib/config";
import { STATUSES, type Status } from "../lib/types";
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
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dupWarn, setDupWarn] = useState(false);

  useEffect(() => {
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function run() {
    setPhase("loading");
    setNote(null);
    try {
      const raw = pending ?? (await extractActiveTab());
      const extraction = buildExtraction(raw);
      const ctx = {
        jobUrl: extraction.url,
        title: extraction.title,
        today: todayLocal(),
      };
      try {
        const parsed = await api.parseJobFromText(extraction.text);
        setForm(parseResponseToForm(parsed, ctx));
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
    }
  }

  async function startManual() {
    setError(null);
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
    setForm((f) => (f ? { ...f, [key]: value } : f));
    if (key === "company" || key === "role") setDupWarn(false);
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

  if (phase === "loading") return <BrandLoader label="Reading page…" />;
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
        <div className="brand">Saved ✓</div>
        <a className="btn primary" href={config.dashboardUrl} target="_blank" rel="noreferrer">
          View in Applyd
        </a>
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
      {note && <div className="note">{note}</div>}
      <label className="field">
        <span>Company</span>
        <input value={form.company} onChange={(e) => update("company", e.target.value)} required />
      </label>
      <label className="field">
        <span>Role</span>
        <input value={form.role} onChange={(e) => update("role", e.target.value)} required />
      </label>
      <div className="row">
        <label className="field grow">
          <span>Status</span>
          <select value={form.status} onChange={(e) => update("status", e.target.value as Status)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="field grow">
          <span>Date applied</span>
          <input type="date" value={form.date_applied} onChange={(e) => update("date_applied", e.target.value)} required />
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
        <div className="note warn">
          You already have an application for this company + role. Save anyway?
        </div>
      )}
      {error && <div className="error">{error}</div>}
      <button className="btn primary" type="submit" disabled={phase === "saving"}>
        {phase === "saving" ? "Saving…" : dupWarn ? "Save anyway" : "Save to Applyd"}
      </button>
    </form>
  );
}
