"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/modal";
import { api } from "@/lib/api";
import { STATUSES, type Application, type ApplicationInput, type Status } from "@/lib/types";

interface ApplicationFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: (app: Application) => void;
  onDeleted: (id: string) => void;
  application?: Application;
}

interface FormState {
  company: string;
  role: string;
  location: string;
  status: Status;
  date_applied: string;
  job_url: string;
  salary_range: string;
  contact_name: string;
  notes: string;
  follow_up_date: string;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function initialState(app?: Application): FormState {
  return {
    company: app?.company ?? "",
    role: app?.role ?? "",
    location: app?.location ?? "",
    status: app?.status ?? "Applied",
    date_applied: app?.date_applied ?? todayIso(),
    job_url: app?.job_url ?? "",
    salary_range: app?.salary_range ?? "",
    contact_name: app?.contact_name ?? "",
    notes: app?.notes ?? "",
    follow_up_date: app?.follow_up_date ?? "",
  };
}

export function ApplicationFormDialog({
  open,
  onClose,
  onSaved,
  onDeleted,
  application,
}: ApplicationFormDialogProps) {
  const isEdit = Boolean(application);
  const [form, setForm] = useState<FormState>(initialState(application));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [forceSubmit, setForceSubmit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [parseMode, setParseMode] = useState<"url" | "text">("url");
  const [parseUrl, setParseUrl] = useState("");
  const [parseText, setParseText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(initialState(application));
      setError(null);
      setDuplicateWarning(false);
      setForceSubmit(false);
      setConfirmDelete(false);
      setParseMode("url");
      setParseUrl("");
      setParseText("");
      setParseError(null);
    }
  }, [open, application]);

  async function handleAutofill() {
    const url = parseUrl.trim();
    const text = parseText.trim();
    if (parseMode === "url" && !url) return;
    if (parseMode === "text" && !text) return;
    setParseError(null);
    setParsing(true);
    try {
      const parsed =
        parseMode === "url"
          ? await api.parseJob({ url })
          : await api.parseJob({ text });
      setForm((f) => ({
        ...f,
        company: parsed.company ?? f.company,
        role: parsed.role ?? f.role,
        location: parsed.location ?? f.location,
        salary_range: parsed.salary_range ?? f.salary_range,
        job_url:
          parsed.job_url ?? (parseMode === "url" ? url : f.job_url) ?? f.job_url,
      }));
      // Company/role likely changed → re-run duplicate check on save.
      setDuplicateWarning(false);
      setForceSubmit(false);
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Failed to parse");
    } finally {
      setParsing(false);
    }
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (key === "company" || key === "role") {
      setDuplicateWarning(false);
      setForceSubmit(false);
    }
  }

  function toPayload(): ApplicationInput {
    return {
      company: form.company.trim(),
      role: form.role.trim(),
      location: form.location.trim() || null,
      status: form.status,
      date_applied: form.date_applied,
      job_url: form.job_url.trim() || null,
      salary_range: form.salary_range.trim() || null,
      contact_name: form.contact_name.trim() || null,
      notes: form.notes.trim() || null,
      follow_up_date: form.follow_up_date || null,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.company.trim() || !form.role.trim() || !form.date_applied) {
      setError("Company, role, and date are required.");
      return;
    }

    const url = form.job_url.trim();
    if (url && !/^https?:\/\//i.test(url)) {
      setError("Job URL must start with http:// or https://");
      return;
    }

    const companyChanged =
      !application || form.company.trim() !== application.company;
    const roleChanged =
      !application || form.role.trim() !== application.role;
    const needsDuplicateCheck = !forceSubmit && (companyChanged || roleChanged);

    if (needsDuplicateCheck) {
      try {
        const { exists } = await api.duplicateCheck(
          form.company.trim(),
          form.role.trim(),
          application?.id
        );
        if (exists) {
          setDuplicateWarning(true);
          setForceSubmit(true);
          return;
        }
      } catch {
        // Non-fatal: if the duplicate check fails, allow submission.
      }
    }

    setSaving(true);
    try {
      const payload = toPayload();
      const saved =
        isEdit && application
          ? await api.updateApplication(application.id, payload)
          : await api.createApplication(payload);
      onSaved(saved);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!application) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      await api.deleteApplication(application.id);
      onDeleted(application.id);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
      setDeleting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit application" : "Add application"}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isEdit && (
          <div className="rounded-md border border-border-subtle bg-bg-elevated/60 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-text-secondary">
                Auto-fill from URL or pasted text
              </span>
              <div
                role="tablist"
                aria-label="Auto-fill source"
                className="inline-flex rounded border border-border-subtle bg-bg-base p-0.5 text-xs"
              >
                {(["url", "text"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={parseMode === m}
                    onClick={() => {
                      setParseMode(m);
                      setParseError(null);
                    }}
                    className={`rounded px-2 py-0.5 font-medium transition-colors ${
                      parseMode === m
                        ? "bg-brand-500 text-white"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {m === "url" ? "URL" : "Text"}
                  </button>
                ))}
              </div>
            </div>

            {parseMode === "url" ? (
              <div className="flex gap-2">
                <input
                  id="parse_url"
                  type="url"
                  value={parseUrl}
                  onChange={(e) => setParseUrl(e.target.value)}
                  placeholder="https://…"
                  className="input-base flex-1"
                  disabled={parsing}
                />
                <button
                  type="button"
                  onClick={handleAutofill}
                  disabled={parsing || !parseUrl.trim()}
                  className="btn-secondary whitespace-nowrap"
                >
                  {parsing ? "Parsing…" : "Auto-fill"}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  id="parse_text"
                  value={parseText}
                  onChange={(e) => setParseText(e.target.value)}
                  placeholder="Paste the job description here…"
                  rows={5}
                  className="input-base w-full resize-y"
                  disabled={parsing}
                />
                <button
                  type="button"
                  onClick={handleAutofill}
                  disabled={parsing || !parseText.trim()}
                  className="btn-secondary"
                >
                  {parsing ? "Parsing…" : "Auto-fill"}
                </button>
              </div>
            )}

            {parseError && (
              <p className="mt-2 text-xs text-status-rejected-text">
                {parseError}
              </p>
            )}
            <p className="mt-2 text-[11px] text-text-muted">
              {parseMode === "url"
                ? "Works on direct company career pages (Greenhouse, Lever, Ashby). LinkedIn and Indeed block scrapers — use Text instead."
                : "Paste anything — full posting, snippet, or a single paragraph. Gemini extracts what it can."}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Company *" htmlFor="company">
            <input
              id="company"
              required
              value={form.company}
              onChange={(e) => update("company", e.target.value)}
              className="input-base"
              autoFocus
            />
          </Field>
          <Field label="Role *" htmlFor="role">
            <input
              id="role"
              required
              value={form.role}
              onChange={(e) => update("role", e.target.value)}
              className="input-base"
            />
          </Field>

          <Field label="Status *" htmlFor="status">
            <select
              id="status"
              value={form.status}
              onChange={(e) => update("status", e.target.value as Status)}
              className="input-base"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date applied *" htmlFor="date_applied">
            <input
              id="date_applied"
              type="date"
              required
              value={form.date_applied}
              onChange={(e) => update("date_applied", e.target.value)}
              className="input-base"
            />
          </Field>

          <Field label="Follow-up date" htmlFor="follow_up_date">
            <input
              id="follow_up_date"
              type="date"
              value={form.follow_up_date}
              onChange={(e) => update("follow_up_date", e.target.value)}
              className="input-base"
            />
          </Field>

          <Field label="Location" htmlFor="location">
            <input
              id="location"
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
              className="input-base"
              placeholder="Remote, NYC, etc."
            />
          </Field>
          <Field label="Salary range" htmlFor="salary_range">
            <input
              id="salary_range"
              value={form.salary_range}
              onChange={(e) => update("salary_range", e.target.value)}
              className="input-base"
              placeholder="$80k–$100k"
            />
          </Field>

          <Field label="Job URL" htmlFor="job_url" full>
            <input
              id="job_url"
              type="url"
              value={form.job_url}
              onChange={(e) => update("job_url", e.target.value)}
              className="input-base"
              placeholder="https://…"
            />
          </Field>

          <Field label="Contact name" htmlFor="contact_name" full>
            <input
              id="contact_name"
              value={form.contact_name}
              onChange={(e) => update("contact_name", e.target.value)}
              className="input-base"
              placeholder="Recruiter or hiring manager"
            />
          </Field>

          <Field label="Notes" htmlFor="notes" full>
            <textarea
              id="notes"
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={4}
              className="input-base resize-y"
            />
          </Field>
        </div>

        {duplicateWarning && (
          <div className="rounded-md border border-status-screen-border bg-status-screen-bg px-3 py-2 text-sm text-status-screen-text">
            You already have an application for this company + role. Click Save
            again to add it anyway.
          </div>
        )}

        {error && (
          <div className="rounded-md border border-status-rejected-border bg-status-rejected-bg px-3 py-2 text-sm text-status-rejected-text">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 border-t border-border-subtle pt-4">
          <div>
            {isEdit && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-status-rejected-border bg-status-rejected-bg px-3 py-2 text-sm font-medium text-status-rejected-text transition-colors hover:bg-status-rejected-border/40 disabled:opacity-50"
              >
                {deleting
                  ? "Deleting…"
                  : confirmDelete
                  ? "Click again to confirm"
                  : "Delete"}
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving
                ? "Saving…"
                : duplicateWarning
                ? "Save anyway"
                : isEdit
                ? "Save"
                : "Add application"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

function Field({
  label,
  htmlFor,
  full,
  children,
}: {
  label: string;
  htmlFor: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-xs font-medium text-text-secondary"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
