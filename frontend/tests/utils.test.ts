import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { daysUntil, toLocalIso, formatDate, isHttpUrl } from "@/lib/utils";

describe("isHttpUrl", () => {
  it("accepts http and https, case-insensitively", () => {
    expect(isHttpUrl("http://x.com")).toBe(true);
    expect(isHttpUrl("https://x.com")).toBe(true);
    expect(isHttpUrl("HTTPS://x.com")).toBe(true);
  });

  it("rejects other schemes and bare strings", () => {
    expect(isHttpUrl("ftp://x.com")).toBe(false);
    expect(isHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isHttpUrl("x.com")).toBe(false);
    expect(isHttpUrl("")).toBe(false);
  });
});

describe("daysUntil", () => {
  beforeEach(() => {
    // Pin "now" to a fixed local wall-clock time so the test is deterministic
    // regardless of the machine's timezone.
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 31, 14, 30, 0)); // 2026-05-31 14:30 local
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 0 for today regardless of the current time-of-day", () => {
    expect(daysUntil("2026-05-31")).toBe(0);
  });

  it("returns a positive count for a future date", () => {
    expect(daysUntil("2026-06-03")).toBe(3);
  });

  it("returns a negative count for a past (overdue) date", () => {
    expect(daysUntil("2026-05-28")).toBe(-3);
  });

  it("handles a month boundary", () => {
    expect(daysUntil("2026-06-01")).toBe(1);
  });
});

describe("toLocalIso", () => {
  it("formats a local date as YYYY-MM-DD without UTC shift", () => {
    // Late-evening local time would roll to the next UTC day; toLocalIso must
    // keep the local calendar date. (This is the off-by-one bug class.)
    const d = new Date(2026, 4, 31, 23, 0, 0); // 2026-05-31 23:00 local
    expect(toLocalIso(d)).toBe("2026-05-31");
  });

  it("zero-pads single-digit months and days", () => {
    expect(toLocalIso(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("formatDate", () => {
  it("returns the date portion of a Postgres date without timezone shift", () => {
    // No Date parsing — must not roll back a day in negative-UTC zones.
    expect(formatDate("2026-05-31")).toBe("2026-05-31");
  });

  it("slices the date out of a full timestamp", () => {
    expect(formatDate("2026-05-31T23:00:00Z")).toBe("2026-05-31");
  });

  it("passes through values that aren't a leading ISO date unchanged", () => {
    expect(formatDate("")).toBe("");
    expect(formatDate("not a date")).toBe("not a date");
  });
});
