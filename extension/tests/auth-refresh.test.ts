import { describe, it, expect } from "vitest";
import { needsRefresh } from "../src/lib/auth";

describe("needsRefresh", () => {
  const now = 1_000_000; // seconds

  it("returns true when there is no session", () => {
    expect(needsRefresh(null, now)).toBe(true);
  });

  it("returns true when the token is already expired", () => {
    expect(needsRefresh({ expires_at: now - 1 }, now)).toBe(true);
  });

  it("returns true when the token expires within the 60s skew window", () => {
    expect(needsRefresh({ expires_at: now + 30 }, now)).toBe(true);
  });

  it("returns false when the token is comfortably valid", () => {
    expect(needsRefresh({ expires_at: now + 3600 }, now)).toBe(false);
  });

  it("returns true when expires_at is missing", () => {
    expect(needsRefresh({}, now)).toBe(true);
  });
});
