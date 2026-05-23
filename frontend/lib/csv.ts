import type { Application } from "@/lib/types";

const COLUMNS: { key: keyof Application; header: string }[] = [
  { key: "company", header: "Company" },
  { key: "role", header: "Role" },
  { key: "location", header: "Location" },
  { key: "status", header: "Status" },
  { key: "date_applied", header: "Date Applied" },
  { key: "follow_up_date", header: "Follow-up Date" },
  { key: "job_url", header: "Job URL" },
  { key: "salary_range", header: "Salary Range" },
  { key: "contact_name", header: "Contact" },
  { key: "notes", header: "Notes" },
];

const FORMULA_PREFIXES = ["=", "+", "-", "@", "\t", "\r"];

function escape(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s = String(value);
  // Neutralize spreadsheet formula injection (CWE-1236).
  if (s.length > 0 && FORMULA_PREFIXES.includes(s[0])) {
    s = "'" + s;
  }
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function buildCsv(applications: Application[]): string {
  const headers = COLUMNS.map((c) => c.header).join(",");
  const rows = applications.map((app) =>
    COLUMNS.map((c) => escape(app[c.key])).join(",")
  );
  return [headers, ...rows].join("\r\n");
}

export function downloadCsv(applications: Application[], filename?: string): void {
  const csv = buildCsv(applications);
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download =
    filename ?? `job-applications-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
