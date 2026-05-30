"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Save, Sparkles, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { toLocalIso } from "@/lib/utils";
import { STATUSES, type Application, type ApplicationInput, type Status } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ApplicationFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: (app: Application) => void;
  onDeleted: (app: Application) => void;
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

function initialState(app?: Application): FormState {
  return {
    company: app?.company ?? "",
    role: app?.role ?? "",
    location: app?.location ?? "",
    status: app?.status ?? "Applied",
    date_applied: app?.date_applied ?? toLocalIso(),
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

  function handleDelete() {
    if (!application) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    // Hand the row to the parent, which removes it optimistically and offers
    // Undo via a toast before the API delete actually fires.
    onDeleted(application);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit application" : "Add application"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isEdit && (
            <div className="rounded-lg border border-border bg-surface-sunken/50 p-3.5">
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-mid">
                  <Sparkles className="h-3.5 w-3.5 text-accent" />
                  Auto-fill from URL or pasted text
                </span>
                <div
                  role="tablist"
                  aria-label="Auto-fill source"
                  className="inline-flex rounded-md border border-border bg-surface-raised p-0.5 text-xs shadow-inner-paper"
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
                          ? "bg-gloss-forest text-primary-foreground shadow-forest-button"
                          : "text-ink-mid hover:text-foreground"
                      }`}
                    >
                      {m === "url" ? "URL" : "Text"}
                    </button>
                  ))}
                </div>
              </div>

              {parseMode === "url" ? (
                <div className="flex gap-2">
                  <Input
                    id="parse_url"
                    type="url"
                    value={parseUrl}
                    onChange={(e) => setParseUrl(e.target.value)}
                    placeholder="https://…"
                    disabled={parsing}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAutofill}
                    disabled={parsing || !parseUrl.trim()}
                    className="whitespace-nowrap"
                  >
                    {parsing ? "Parsing…" : "Auto-fill"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Textarea
                    id="parse_text"
                    value={parseText}
                    onChange={(e) => setParseText(e.target.value)}
                    placeholder="Paste the job description here…"
                    rows={5}
                    disabled={parsing}
                    className="resize-y"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAutofill}
                    disabled={parsing || !parseText.trim()}
                  >
                    {parsing ? "Parsing…" : "Auto-fill"}
                  </Button>
                </div>
              )}

              {parseError && (
                <p className="mt-2 text-xs text-status-rejected-fg">
                  {parseError}
                </p>
              )}
              <p className="mt-2 text-[11px] text-ink-soft">
                {parseMode === "url"
                  ? "Works on direct company career pages (Greenhouse, Lever, Ashby). LinkedIn and Indeed block scrapers — use Text instead."
                  : "Paste anything — full posting, snippet, or a single paragraph. Gemini extracts what it can."}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Company *" htmlFor="company">
              <Input
                id="company"
                required
                value={form.company}
                onChange={(e) => update("company", e.target.value)}
                autoFocus
              />
            </Field>
            <Field label="Role *" htmlFor="role">
              <Input
                id="role"
                required
                value={form.role}
                onChange={(e) => update("role", e.target.value)}
              />
            </Field>

            <Field label="Status *" htmlFor="status">
              <Select
                value={form.status}
                onValueChange={(v) => update("status", v as Status)}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Date applied *" htmlFor="date_applied">
              <Input
                id="date_applied"
                type="date"
                required
                value={form.date_applied}
                onChange={(e) => update("date_applied", e.target.value)}
              />
            </Field>

            <Field label="Follow-up date" htmlFor="follow_up_date">
              <Input
                id="follow_up_date"
                type="date"
                value={form.follow_up_date}
                onChange={(e) => update("follow_up_date", e.target.value)}
              />
            </Field>

            <Field label="Location" htmlFor="location">
              <Input
                id="location"
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                placeholder="Remote, NYC, etc."
              />
            </Field>
            <Field label="Salary range" htmlFor="salary_range">
              <Input
                id="salary_range"
                value={form.salary_range}
                onChange={(e) => update("salary_range", e.target.value)}
                placeholder="$80k–$100k"
              />
            </Field>

            <Field label="Job URL" htmlFor="job_url" full>
              <Input
                id="job_url"
                type="url"
                value={form.job_url}
                onChange={(e) => update("job_url", e.target.value)}
                placeholder="https://…"
              />
            </Field>

            <Field label="Contact name" htmlFor="contact_name" full>
              <Input
                id="contact_name"
                value={form.contact_name}
                onChange={(e) => update("contact_name", e.target.value)}
                placeholder="Recruiter or hiring manager"
              />
            </Field>

            <Field label="Notes" htmlFor="notes" full>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                rows={4}
                className="resize-y"
              />
            </Field>
          </div>

          {duplicateWarning && (
            <div className="flex items-start gap-2 rounded-md border border-status-screen-border bg-status-screen-bg px-3 py-2 text-sm text-status-screen-fg">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>
                You already have an application for this company + role. Click
                Save again to add it anyway.
              </span>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-status-rejected-border bg-status-rejected-bg px-3 py-2 text-sm text-status-rejected-fg">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
            <div>
              {isEdit && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  size="sm"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {confirmDelete ? "Click again to confirm" : "Delete"}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                <Save className="h-3.5 w-3.5" />
                {saving
                  ? "Saving…"
                  : duplicateWarning
                  ? "Save anyway"
                  : isEdit
                  ? "Save"
                  : "Add application"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
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
    <div className={`space-y-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
