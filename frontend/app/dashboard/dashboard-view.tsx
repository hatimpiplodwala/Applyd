"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BarChart3, Columns3, Download, Plus, RotateCcw, ServerCrash, Table2, X } from "lucide-react";
import { StatsSidebar } from "@/components/stats-sidebar";
import { ApplicationsTable } from "@/components/applications-table";
import { ApplicationFormDialog } from "@/components/application-form-dialog";
import { KanbanBoard } from "@/components/kanban-board";
import { AnalyticsView } from "@/components/analytics-view";
import { EmptyOnboarding } from "@/components/empty-onboarding";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { downloadCsv } from "@/lib/csv";
import { insertSorted, insertManySorted } from "@/lib/applications";
import type { Application, Status } from "@/lib/types";

type View = "table" | "kanban" | "analytics";

const MAX_LOAD_RETRIES = 5;

interface DashboardViewProps {
  email: string;
}

export function DashboardView({ email }: DashboardViewProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Application | null>(null);
  const [view, setView] = useState<View>("table");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{
    message: string;
    apps?: Application[];
  } | null>(null);
  const attemptRef = useRef(0);
  // Timers for deletes awaiting their undo window, keyed by application id.
  const pendingRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const UNDO_WINDOW_MS = 6000;

  const load = useCallback(async () => {
    try {
      const data = await api.listApplications();
      setApplications(data);
      attemptRef.current = 0;
      setLoading(false);
    } catch {
      attemptRef.current += 1;
      if (attemptRef.current >= MAX_LOAD_RETRIES) {
        setLoading(false);
        setLoadError(true);
        return;
      }
      const delay = Math.min(30_000, 1_000 * 2 ** Math.min(attemptRef.current, 5));
      setTimeout(load, delay);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function handleRetry() {
    attemptRef.current = 0;
    setLoadError(false);
    setLoading(true);
    load();
  }

  function handleSaved(app: Application) {
    setApplications((prev) => {
      const idx = prev.findIndex((a) => a.id === app.id);
      if (idx === -1) return [app, ...prev];
      const next = prev.slice();
      next[idx] = app;
      return next;
    });
  }

  async function handleStatusChange(app: Application, status: Status) {
    if (app.status === status) return;
    handleSaved({ ...app, status });
    try {
      const updated = await api.updateApplication(app.id, { status });
      handleSaved(updated);
    } catch {
      handleSaved(app);
      setToast({ message: "Couldn't update status — reverted." });
    }
  }

  // The API delete fires only after the undo window elapses.
  async function commitDelete(app: Application) {
    pendingRef.current.delete(app.id);
    setToast((t) => (t?.apps?.some((a) => a.id === app.id) ? null : t));
    try {
      await api.deleteApplication(app.id);
    } catch {
      setApplications((prev) => insertSorted(prev, app));
      setToast({ message: "Couldn't delete — restored it." });
    }
  }

  // Optimistically remove rows now; schedule the real deletes after the undo window.
  function scheduleDeletes(apps: Application[], message: string) {
    const ids = new Set(apps.map((a) => a.id));
    setApplications((prev) => prev.filter((a) => !ids.has(a.id)));
    for (const app of apps) {
      const timer = setTimeout(() => void commitDelete(app), UNDO_WINDOW_MS);
      pendingRef.current.set(app.id, timer);
    }
    setToast({ message, apps });
  }

  function handleDeleted(app: Application) {
    scheduleDeletes([app], `Deleted ${app.company}`);
  }

  function handleDeletedMany(apps: Application[]) {
    if (apps.length === 0) return;
    scheduleDeletes(
      apps,
      `Deleted ${apps.length} application${apps.length === 1 ? "" : "s"}`
    );
  }

  function handleUndo(apps: Application[]) {
    for (const app of apps) {
      const timer = pendingRef.current.get(app.id);
      if (timer) clearTimeout(timer);
      pendingRef.current.delete(app.id);
    }
    setApplications((prev) => insertManySorted(prev, apps));
    setToast(null);
  }

  function handleBulkStatus(status: Status) {
    const targets = applications.filter((a) => selected.has(a.id));
    setSelected(new Set());
    for (const app of targets) void handleStatusChange(app, status);
  }

  function handleBulkDelete() {
    const targets = applications.filter((a) => selected.has(a.id));
    setSelected(new Set());
    handleDeletedMany(targets);
  }

  // Auto-dismiss the transient error toast (the undo toast clears on commit).
  useEffect(() => {
    if (!toast || toast.apps) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // On unmount, flush any pending deletes so navigating away doesn't lose them.
  useEffect(() => {
    const pending = pendingRef.current;
    return () => {
      pending.forEach((timer, id) => {
        clearTimeout(timer);
        void api.deleteApplication(id).catch(() => {});
      });
      pending.clear();
    };
  }, []);

  // Drop any selected ids whose rows no longer exist (e.g. one was deleted via
  // the edit dialog) so the selection toolbar can't show a phantom count.
  useEffect(() => {
    setSelected((prev) => {
      if (prev.size === 0) return prev;
      const ids = new Set(applications.map((a) => a.id));
      const next = new Set<string>();
      for (const id of prev) if (ids.has(id)) next.add(id);
      return next.size === prev.size ? prev : next;
    });
  }, [applications]);

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
              <p className="eyebrow">Dashboard</p>
              <h2 className="mt-1 font-serif text-3xl font-medium tracking-tight text-foreground">
                Applications
              </h2>
              <p className="mt-1 text-sm text-ink-mid">
                Track everywhere you&apos;ve applied.
              </p>
            </div>
            <div className="flex gap-2 sm:flex-shrink-0">
              <Button
                variant="secondary"
                onClick={handleExport}
                disabled={applications.length === 0}
                className="flex-1 sm:flex-none"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <Button
                onClick={() => setAddOpen(true)}
                className="flex-1 sm:flex-none"
              >
                <Plus className="h-4 w-4" />
                Add application
              </Button>
            </div>
          </div>

          <Tabs
            value={view}
            onValueChange={(v) => setView(v as View)}
            className="mb-4"
          >
            <TabsList aria-label="Application view">
              <TabsTrigger value="table">
                <Table2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Table</span>
              </TabsTrigger>
              <TabsTrigger value="kanban">
                <Columns3 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Kanban</span>
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <BarChart3 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div key={view} className="animate-fade-in">
            {loadError ? (
              <LoadError onRetry={handleRetry} />
            ) : !loading && applications.length === 0 ? (
              <EmptyOnboarding onAdd={() => setAddOpen(true)} />
            ) : view === "table" ? (
              <ApplicationsTable
                applications={applications}
                loading={loading}
                onEdit={setEditing}
                onStatusChange={handleStatusChange}
                selected={selected}
                onSelectedChange={setSelected}
                onBulkStatus={handleBulkStatus}
                onBulkDelete={handleBulkDelete}
              />
            ) : view === "kanban" ? (
              <KanbanBoard
                applications={applications}
                onEdit={setEditing}
                onSaved={handleSaved}
              />
            ) : (
              <AnalyticsView applications={applications} />
            )}
          </div>
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

      {toast && (
        <UndoToast
          message={toast.message}
          onUndo={toast.apps ? () => handleUndo(toast.apps!) : undefined}
          onDismiss={() => setToast(null)}
        />
      )}
    </>
  );
}

function UndoToast({
  message,
  onUndo,
  onDismiss,
}: {
  message: string;
  onUndo?: () => void;
  onDismiss: () => void;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-fade-in fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
    >
      <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-raised px-4 py-2.5 text-sm text-foreground shadow-paper-raised">
        <span className="text-ink-mid">{message}</span>
        {onUndo && (
          <button
            type="button"
            onClick={onUndo}
            className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Undo
          </button>
        )}
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="text-ink-soft hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="flex flex-col items-center gap-3 px-4 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface-sunken text-ink-soft">
        <ServerCrash className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">
          Couldn&apos;t load applications
        </p>
        <p className="mt-1 text-xs text-ink-soft">
          The server may be unavailable. Check your connection and try again.
        </p>
      </div>
      <Button variant="secondary" size="sm" onClick={onRetry}>
        Retry
      </Button>
    </Card>
  );
}
