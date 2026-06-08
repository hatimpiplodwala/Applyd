"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ExternalLink,
  Inbox,
  SearchX,
} from "lucide-react";
import { FollowUpBadge } from "@/components/follow-up-badge";
import { FilterBar, type StatusFilter } from "@/components/filter-bar";
import { Card } from "@/components/ui/card";
import { InlineStatusSelect } from "@/components/inline-status-select";
import { SelectionToolbar } from "@/components/selection-toolbar";
import type { Application, Status } from "@/lib/types";
import { daysUntil, formatDate } from "@/lib/utils";

interface ApplicationsTableProps {
  applications: Application[];
  loading: boolean;
  onEdit: (app: Application) => void;
  onStatusChange: (app: Application, status: Status) => void;
  selected: Set<string>;
  onSelectedChange: (next: Set<string>) => void;
  onBulkStatus: (status: Status) => void;
  onBulkDelete: () => void;
}

type SortKey = "date_applied" | "company" | "role" | "status";
type SortDir = "asc" | "desc";

export function ApplicationsTable({
  applications,
  loading,
  onEdit,
  onStatusChange,
  selected,
  onSelectedChange,
  onBulkStatus,
  onBulkDelete,
}: ApplicationsTableProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date_applied");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Debounce the term that actually drives filtering; the input stays instant.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 150);
    return () => clearTimeout(t);
  }, [search]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    let rows = applications.filter((a) => {
      if (statusFilter !== "All" && a.status !== statusFilter) return false;
      if (
        q &&
        !a.company.toLowerCase().includes(q) &&
        !a.role.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });

    rows = [...rows].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return rows;
  }, [applications, statusFilter, debouncedSearch, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "date_applied" ? "desc" : "asc");
    }
  }

  const hasFilters = statusFilter !== "All" || search.trim().length > 0;

  const searchRef = useRef<HTMLInputElement>(null);

  // "/" jumps focus to the search box, unless typing in a field or operating an
  // open Radix popup (whose listbox/combobox would otherwise lose focus).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "/" || e.defaultPrevented) return;
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable ||
          t.closest(
            '[role="listbox"], [role="menu"], [role="dialog"], [role="combobox"]'
          ))
      ) {
        return;
      }
      e.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="space-y-4">
      <FilterBar
        status={statusFilter}
        search={search}
        searchRef={searchRef}
        onStatusChange={setStatusFilter}
        onSearchChange={setSearch}
        onClear={() => {
          setStatusFilter("All");
          setSearch("");
        }}
      />

      <Card className="overflow-hidden p-0">
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-border bg-surface-sunken text-left text-xs uppercase tracking-wider text-ink-soft">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    className="h-3.5 w-3.5 accent-primary"
                    checked={
                      filtered.length > 0 &&
                      filtered.every((a) => selected.has(a.id))
                    }
                    onChange={(e) => {
                      const next = new Set(selected);
                      for (const a of filtered) {
                        if (e.target.checked) next.add(a.id);
                        else next.delete(a.id);
                      }
                      onSelectedChange(next);
                    }}
                  />
                </th>
                <SortableHeader
                  label="Company"
                  active={sortKey === "company"}
                  dir={sortDir}
                  onClick={() => toggleSort("company")}
                />
                <SortableHeader
                  label="Role"
                  active={sortKey === "role"}
                  dir={sortDir}
                  onClick={() => toggleSort("role")}
                />
                <SortableHeader
                  label="Status"
                  active={sortKey === "status"}
                  dir={sortDir}
                  onClick={() => toggleSort("status")}
                />
                <SortableHeader
                  label="Date applied"
                  active={sortKey === "date_applied"}
                  dir={sortDir}
                  onClick={() => toggleSort("date_applied")}
                />
                <th className="hidden px-4 py-3 font-medium lg:table-cell">Location</th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">Salary</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Link</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows />
              ) : filtered.length === 0 ? (
                <EmptyRow hasFilters={hasFilters} />
              ) : (
                filtered.map((a) => (
                  <Row
                    key={a.id}
                    app={a}
                    onEdit={() => onEdit(a)}
                    onStatusChange={(status) => onStatusChange(a, status)}
                    selected={selected.has(a.id)}
                    onSelect={(checked) => {
                      const next = new Set(selected);
                      if (checked) next.add(a.id);
                      else next.delete(a.id);
                      onSelectedChange(next);
                    }}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {!loading && filtered.length > 0 && (
        <p className="text-xs text-ink-soft">
          Showing {filtered.length} of {applications.length}
        </p>
      )}

      {selected.size > 0 && (
        <SelectionToolbar
          count={selected.size}
          onStatus={onBulkStatus}
          onDelete={onBulkDelete}
          onClear={() => onSelectedChange(new Set())}
        />
      )}
    </div>
  );
}

function SortableHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
}) {
  const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th className="px-4 py-3 font-medium">
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 transition-colors ${
          active ? "text-foreground" : "hover:text-ink-mid"
        }`}
      >
        {label}
        <Icon className={`h-3 w-3 ${active ? "text-primary" : "text-ink-soft"}`} />
      </button>
    </th>
  );
}

function Row({
  app,
  onEdit,
  onStatusChange,
  selected,
  onSelect,
}: {
  app: Application;
  onEdit: () => void;
  onStatusChange: (status: Status) => void;
  selected: boolean;
  onSelect: (checked: boolean) => void;
}) {
  // The row is a mouse convenience: clicking it opens the editor, except on the
  // interactive controls (checkbox, status select, link, company button), which
  // handle their own clicks. Keyboard/AT users edit via the company button so
  // the row needs no button role of its own (avoids nesting interactive
  // controls inside a role="button"). Detection via closest() keeps each cell
  // self-contained.
  const isInteractive = (target: EventTarget | null) =>
    !!(target as HTMLElement | null)?.closest(
      'a, button, input, select, [role="combobox"], [role="listbox"]'
    );

  // Overdue / due-today follow-ups get a left accent so they catch the eye.
  const urgent =
    app.follow_up_date != null && daysUntil(app.follow_up_date) <= 0;

  return (
    <tr
      onClick={(e) => {
        if (isInteractive(e.target)) return;
        onEdit();
      }}
      className={`animate-fade-in cursor-pointer border-b border-l-2 border-border/60 transition-colors last:border-b-0 hover:bg-surface-sunken/40 ${
        urgent ? "border-l-status-rejected-fg" : "border-l-transparent"
      } ${selected ? "bg-surface-sunken/40" : ""}`}
    >
      <td className="w-10 px-4 py-3">
        <input
          type="checkbox"
          aria-label={`Select ${app.company}`}
          className="h-3.5 w-3.5 accent-primary"
          checked={selected}
          onChange={(e) => onSelect(e.target.checked)}
        />
      </td>
      <td className="px-4 py-3 font-medium text-foreground">
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${app.company}`}
          className="text-left hover:underline focus-visible:underline focus-visible:outline-none"
        >
          {app.company}
        </button>
        {app.follow_up_date && (
          <FollowUpBadge date={app.follow_up_date} className="mt-1 font-normal" />
        )}
      </td>
      <td className="px-4 py-3 text-ink-mid">{app.role}</td>
      <td className="px-4 py-3">
        <InlineStatusSelect
          status={app.status}
          onChange={onStatusChange}
          label={app.company}
        />
      </td>
      <td className="px-4 py-3 tabular-nums text-ink-mid">
        {formatDate(app.date_applied)}
      </td>
      <td className="hidden px-4 py-3 text-ink-mid lg:table-cell">
        {app.location ?? "—"}
      </td>
      <td className="hidden px-4 py-3 text-ink-mid lg:table-cell">
        {app.salary_range ?? "—"}
      </td>
      <td className="hidden px-4 py-3 md:table-cell">
        {app.job_url && /^https?:\/\//i.test(app.job_url) ? (
          <a
            href={app.job_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            View
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <span className="text-ink-soft">—</span>
        )}
      </td>
    </tr>
  );
}

function EmptyRow({ hasFilters }: { hasFilters: boolean }) {
  const Icon = hasFilters ? SearchX : Inbox;
  return (
    <tr>
      <td colSpan={8} className="px-4 py-16 text-center">
        <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface-sunken text-ink-soft">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {hasFilters ? "No matches" : "No applications yet"}
            </p>
            <p className="mt-1 text-xs text-ink-soft">
              {hasFilters
                ? "Try clearing your filters or searching for something else."
                : "Add your first application to start tracking your job search."}
            </p>
          </div>
        </div>
      </td>
    </tr>
  );
}

function SkeletonRows() {
  const cells: { hide?: string; w: string }[] = [
    { w: "w-4" },
    { w: "w-28" },
    { w: "w-36" },
    { w: "w-20" },
    { w: "w-24" },
    { hide: "hidden lg:table-cell", w: "w-20" },
    { hide: "hidden lg:table-cell", w: "w-24" },
    { hide: "hidden md:table-cell", w: "w-12" },
  ];
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-border/60 last:border-0">
          {cells.map((c, j) => (
            <td key={j} className={`px-4 py-4 ${c.hide ?? ""}`}>
              <div className={`skeleton h-3 ${c.w}`} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

