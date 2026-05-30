"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ExternalLink,
  Inbox,
  Pencil,
  SearchX,
} from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { FollowUpBadge } from "@/components/follow-up-badge";
import { FilterBar, type StatusFilter } from "@/components/filter-bar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Application } from "@/lib/types";

interface ApplicationsTableProps {
  applications: Application[];
  loading: boolean;
  onEdit: (app: Application) => void;
}

type SortKey = "date_applied" | "company" | "role" | "status";
type SortDir = "asc" | "desc";

export function ApplicationsTable({
  applications,
  loading,
  onEdit,
}: ApplicationsTableProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date_applied");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
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
  }, [applications, statusFilter, search, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "date_applied" ? "desc" : "asc");
    }
  }

  const hasFilters = statusFilter !== "All" || search.trim().length > 0;

  return (
    <div className="space-y-4">
      <FilterBar
        status={statusFilter}
        search={search}
        onStatusChange={setStatusFilter}
        onSearchChange={setSearch}
      />

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-sunken/60 text-left text-xs uppercase tracking-wider text-ink-soft">
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
                <th className="px-4 py-3" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows />
              ) : filtered.length === 0 ? (
                <EmptyRow hasFilters={hasFilters} />
              ) : (
                filtered.map((a) => (
                  <Row key={a.id} app={a} onEdit={() => onEdit(a)} />
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

function Row({ app, onEdit }: { app: Application; onEdit: () => void }) {
  return (
    <tr className="group border-b border-border/60 transition-colors last:border-0 hover:bg-surface-sunken/40">
      <td className="px-4 py-3 font-medium text-foreground">
        <div>{app.company}</div>
        {app.follow_up_date && (
          <FollowUpBadge date={app.follow_up_date} className="mt-1 font-normal" />
        )}
      </td>
      <td className="px-4 py-3 text-ink-mid">{app.role}</td>
      <td className="px-4 py-3">
        <StatusBadge status={app.status} />
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
      <td className="px-4 py-3 text-right">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onEdit}
          aria-label={`Edit ${app.company}`}
          className="md:opacity-0 md:transition-opacity md:group-hover:opacity-100 md:focus:opacity-100"
        >
          <Pencil className="h-3.5 w-3.5" />
          <span>Edit</span>
        </Button>
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
    { w: "w-28" },
    { w: "w-36" },
    { w: "w-20" },
    { w: "w-24" },
    { hide: "hidden lg:table-cell", w: "w-20" },
    { hide: "hidden lg:table-cell", w: "w-24" },
    { hide: "hidden md:table-cell", w: "w-12" },
    { w: "w-10" },
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

function formatDate(iso: string): string {
  // Postgres `date` arrives as YYYY-MM-DD. Parsing via new Date() treats it
  // as UTC midnight and toLocaleDateString shifts to local — landing on the
  // previous day in negative-UTC zones. Slice the string instead.
  return /^\d{4}-\d{2}-\d{2}/.test(iso) ? iso.slice(0, 10) : iso;
}


