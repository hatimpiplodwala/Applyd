import { describe, expect, it } from "vitest";
import { insertSorted, insertManySorted } from "@/lib/applications";
import type { Application } from "@/lib/types";

function app(id: string, date: string): Application {
  return {
    id,
    user_id: "u",
    company: id,
    role: "r",
    location: null,
    status: "Applied",
    date_applied: date,
    job_url: null,
    salary_range: null,
    contact_name: null,
    notes: null,
    follow_up_date: null,
    created_at: "",
    updated_at: "",
  };
}

describe("insertSorted", () => {
  it("inserts keeping date_applied descending", () => {
    const list = [app("a", "2026-05-10"), app("c", "2026-05-01")];
    const out = insertSorted(list, app("b", "2026-05-05"));
    expect(out.map((a) => a.id)).toEqual(["a", "b", "c"]);
  });
});

describe("insertManySorted", () => {
  it("re-inserts multiple rows in date_applied-desc order", () => {
    const list = [app("a", "2026-05-10")];
    const out = insertManySorted(list, [
      app("c", "2026-05-01"),
      app("b", "2026-05-05"),
    ]);
    expect(out.map((a) => a.id)).toEqual(["a", "b", "c"]);
  });

  it("returns the original list unchanged when given no rows", () => {
    const list = [app("a", "2026-05-10")];
    expect(insertManySorted(list, [])).toEqual(list);
  });
});
