"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { AlertCircle, Calendar, MapPin, MoveRight } from "lucide-react";
import { StatusDot } from "@/components/status-badge";
import { FollowUpBadge } from "@/components/follow-up-badge";
import { api } from "@/lib/api";
import { groupByStatus } from "@/lib/applications";
import { STATUSES, type Application, type Status } from "@/lib/types";

interface KanbanBoardProps {
  applications: Application[];
  onEdit: (app: Application) => void;
  onSaved: (app: Application) => void;
}

export function KanbanBoard({ applications, onEdit, onSaved }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  );

  const grouped = useMemo(() => groupByStatus(applications), [applications]);

  const activeApp = activeId
    ? applications.find((a) => a.id === activeId) ?? null
    : null;

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
    setError(null);
  }

  async function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const id = String(active.id);
    const newStatus = String(over.id) as Status;
    const app = applications.find((a) => a.id === id);
    if (!app || app.status === newStatus) return;

    onSaved({ ...app, status: newStatus });
    try {
      const updated = await api.updateApplication(id, { status: newStatus });
      onSaved(updated);
    } catch (err) {
      onSaved(app);
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-start gap-2 rounded-md border border-status-rejected-border bg-status-rejected-bg px-3 py-2 text-sm text-status-rejected-fg">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="flex gap-3 overflow-x-auto pb-3">
          {STATUSES.map((status) => (
            <Column
              key={status}
              status={status}
              apps={grouped[status]}
              onEdit={onEdit}
            />
          ))}
        </div>
        <DragOverlay>
          {activeApp ? <Card app={activeApp} dragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function Column({
  status,
  apps,
  onEdit,
}: {
  status: Status;
  apps: Application[];
  onEdit: (app: Application) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div className="flex w-72 flex-shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <StatusDot status={status} />
          <span className="text-sm font-medium text-foreground">{status}</span>
        </div>
        <span className="rounded-full bg-surface-sunken px-2 py-0.5 text-xs font-medium tabular-nums text-ink-soft">
          {apps.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex min-h-[200px] flex-col gap-2 rounded-lg border p-2 transition-all ${
          isOver
            ? "border-primary bg-primary/5 shadow-forest-glow"
            : "border-border bg-surface-sunken/40"
        }`}
      >
        {apps.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-border/60 px-2 py-6 text-center">
            <MoveRight className="h-4 w-4 text-ink-soft" />
            <p className="text-xs text-ink-soft">Drop here</p>
          </div>
        ) : (
          apps.map((app) => (
            <DraggableCard key={app.id} app={app} onEdit={() => onEdit(app)} />
          ))
        )}
      </div>
    </div>
  );
}

function DraggableCard({
  app,
  onEdit,
}: {
  app: Application;
  onEdit: () => void;
}) {
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({
    id: app.id,
  });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onEdit}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onEdit();
        }
      }}
      className={`cursor-grab touch-none active:cursor-grabbing ${
        isDragging ? "opacity-30" : ""
      }`}
    >
      <Card app={app} />
    </div>
  );
}

function Card({ app, dragging }: { app: Application; dragging?: boolean }) {
  return (
    <div
      className={`paper-shine relative rounded-lg border border-border bg-card p-3 text-sm transition-all ${
        dragging
          ? "rotate-1 shadow-paper-hover ring-2 ring-primary"
          : "shadow-paper hover:shadow-paper-hover"
      }`}
    >
      <div className="font-medium text-foreground">{app.company}</div>
      <div className="text-xs text-ink-mid">{app.role}</div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-ink-soft">
        <span className="inline-flex items-center gap-1 tabular-nums">
          <Calendar className="h-2.5 w-2.5" />
          {app.date_applied}
        </span>
        {app.location && (
          <span className="inline-flex items-center gap-1 truncate pl-2">
            <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
            <span className="truncate">{app.location}</span>
          </span>
        )}
      </div>
      {app.follow_up_date && (
        <FollowUpBadge date={app.follow_up_date} className="mt-2" />
      )}
    </div>
  );
}

