import { describe, it, expect } from "vitest";
import { friendlyError } from "../src/lib/api";

describe("friendlyError", () => {
  it("maps known statuses to human messages, ignoring the body", () => {
    expect(friendlyError(429, "")).toMatch(/fast/i);
    expect(friendlyError(401, "")).toMatch(/session expired/i);
    expect(friendlyError(403, "")).toMatch(/session expired/i);
    expect(friendlyError(500, "")).toMatch(/server/i);
    expect(friendlyError(503, "")).toMatch(/server/i);
  });

  it("surfaces a FastAPI string detail for other statuses", () => {
    expect(friendlyError(400, JSON.stringify({ detail: "Company is required" }))).toBe(
      "Company is required"
    );
  });

  it("joins FastAPI validation-error arrays", () => {
    const body = JSON.stringify({
      detail: [{ msg: "field required" }, { msg: "too long" }],
    });
    expect(friendlyError(422, body)).toBe("field required; too long");
  });

  it("falls back to the status code when the body is not JSON", () => {
    expect(friendlyError(418, "not json")).toBe("Something went wrong (HTTP 418).");
  });
});
