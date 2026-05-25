"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BarChart3, Columns3, Download, Plus, Table2 } from "lucide-react";
import { StatsSidebar } from "@/components/stats-sidebar";
import { ApplicationsTable } from "@/components/applications-table";
import { ApplicationFormDialog } from "@/components/application-form-dialog";
import { KanbanBoard } from "@/components/kanban-board";
import { AnalyticsView } from "@/components/analytics-view";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { downloadCsv } from "@/lib/csv";
import type { Application } from "@/lib/types";

type View = "table" | "kanban" | "analytics";

interface DashboardViewProps {
  email: string;
}

export function DashboardView({ email }: DashboardViewProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Application | null>(null);
  const [view, setView] = useState<View>("table");
  const attemptRef = useRef(0);

  const load = useCallback(async () => {
    try {
      const data = await api.listApplications();
      setApplications(data);
      attemptRef.current = 0;
      setLoading(false);
    } catch {
      attemptRef.current += 1;
      // Exponential backoff, capped at 30s. Retry silently — no UI noise.
      const delay = Math.min(30_000, 1_000 * 2 ** Math.min(attemptRef.current, 5));
      setTimeout(load, delay);
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
            {view === "table" && (
              <ApplicationsTable
                applications={applications}
                loading={loading}
                onEdit={setEditing}
              />
            )}
            {view === "kanban" && (
              <KanbanBoard
                applications={applications}
                onEdit={setEditing}
                onSaved={handleSaved}
              />
            )}
            {view === "analytics" && (
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
    </>
  );
}
