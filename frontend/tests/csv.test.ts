import { describe, it, expect } from "vitest";
import { buildCsv } from "@/lib/csv";
import type { Application } from "@/lib/types";

function app(overrides: Partial<Application> = {}): Application {
  return {
    id: "1",
    user_id: "u1",
    company: "Acme",
    role: "Engineer",
    location: "Remote",
    status: "Applied",
    date_applied: "2026-05-29",
    follow_up_date: null,
    job_url: "https://acme.com/jobs/1",
    salary_range: "$120k-$150k",
    contact_name: null,
    notes: null,
    created_at: "2026-05-29T00:00:00Z",
    ...overrides,
  } as Application;
}

describe("buildCsv", () => {
  it("emits a header row and CRLF line endings", () => {
    const csv = buildCsv([]);
    expect(csv.startsWith("Company,Role,Location,Status,Date Applied")).toBe(true);
    // header only, no trailing newline
    expect(csv.includes("\n")).toBe(false);
  });

  it("renders a basic row in column order", () => {
    const [, row] = buildCsv([app()]).split("\r\n");
    expect(row).toBe(
      'Acme,Engineer,Remote,Applied,2026-05-29,,https://acme.com/jobs/1,$120k-$150k,,'
    );
  });

  it("renders null/undefined fields as empty cells", () => {
    const [, row] = buildCsv([app({ location: null, notes: null })]).split("\r\n");
    const cells = row.split(",");
    expect(cells[2]).toBe(""); // location
    expect(cells[cells.length - 1]).toBe(""); // notes
  });

  it("quotes and escapes values containing commas, quotes, or newlines", () => {
    const [, row] = buildCsv([
      app({ notes: 'Said "hi", then left\nnew line' }),
    ]).split("\r\n");
    expect(row.endsWith('"Said ""hi"", then left\nnew line"')).toBe(true);
  });

  it("neutralizes spreadsheet formula injection (CWE-1236)", () => {
    for (const prefix of ["=", "+", "-", "@"]) {
      const [, row] = buildCsv([
        app({ company: `${prefix}cmd`, role: "x" }),
      ]).split("\r\n");
      // Leading sentinel quote prepended so the cell is treated as text.
      expect(row.startsWith(`'${prefix}cmd,`)).toBe(true);
    }
  });

  it("wraps a formula-injection value that also contains a comma", () => {
    const [, row] = buildCsv([app({ company: "=1,2" })]).split("\r\n");
    // Prefixed with sentinel, then wrapped because of the comma.
    expect(row.startsWith(`"'=1,2"`)).toBe(true);
  });
});
