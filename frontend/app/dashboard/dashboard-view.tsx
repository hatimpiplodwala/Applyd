"use client";

import { useCallback, useEffect, useState } from "react";
import { StatsSidebar } from "@/components/stats-sidebar";
import { ApplicationsTable } from "@/components/applications-table";
import { ApplicationFormDialog } from "@/components/application-form-dialog";
import { KanbanBoard } from "@/components/kanban-board";
import { api } from "@/lib/api";
import { downloadCsv } from "@/lib/csv";
import type { Application } from "@/lib/types";

type View = "table" | "kanban";

interface DashboardViewProps {
  email: string;
}

export function DashboardView({ email }: DashboardViewProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Application | null>(null);
  const [view, setView] = useState<View>("table");

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api.listApplications();
      setApplications(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function handleSaved(app: Application) {
    setApplications((prev) => {
      const idx = prev.findIndex((a) => a.id === app.id);
      if (idx === -1) return [app, ...prev];
      const next = prev.slice();
      next[idx] = app;
      return next;
    });
  }

  function handleDeleted(id: string) {
    setApplications((prev) => prev.filter((a) => a.id !== id));
  }

  function handleExport() {
    if (applications.length === 0) return;
    downloadCsv(applications);
  }

  return (
    <>
      <StatsSidebar email={email} applications={applications} />

      <main className="flex-1 overflow-x-auto">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 md:px-8 md:py-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                Applications
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                Track everywhere you&apos;ve applied.
              </p>
            </div>
            <div className="flex gap-2 sm:flex-shrink-0">
              <button
                onClick={handleExport}
                disabled={applications.length === 0}
                className="btn-secondary flex-1 sm:flex-none"
              >
                Export CSV
              </button>
              <button
                onClick={() => setAddOpen(true)}
                className="btn-primary flex-1 sm:flex-none"
              >
                + Add application
              </button>
            </div>
          </div>

          {error && (
            <div className="card mb-4 border-status-rejected-border p-4">
              <p className="text-sm text-status-rejected-text">{error}</p>
              <button onClick={load} className="btn-ghost mt-2">
                Retry
              </button>
            </div>
          )}

          <ViewTabs view={view} onChange={setView} />

          {view === "table" ? (
            <ApplicationsTable
              applications={applications}
              loading={loading}
              onEdit={setEditing}
            />
          ) : (
            <KanbanBoard
              applications={applications}
              onEdit={setEditing}
              onSaved={handleSaved}
            />
          )}
        </div>
      </main>

      <ApplicationFormDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
      />

      <ApplicationFormDialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
        application={editing ?? undefined}
      />
    </>
  );
}

function ViewTabs({
  view,
  onChange,
}: {
  view: View;
  onChange: (v: View) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Application view"
      className="mb-4 inline-flex rounded-md border border-border-subtle bg-bg-elevated p-1"
    >
      {(["table", "kanban"] as const).map((v) => (
        <button
          key={v}
          role="tab"
          aria-selected={view === v}
          onClick={() => onChange(v)}
          className={`rounded px-3 py-1 text-sm font-medium capitalize transition-colors ${
            view === v
              ? "bg-brand-500 text-white"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          {v}
        </button>
      ))}
    </div>
  );
}
