import { describe, it, expect } from "vitest";
import {
  trimPageText,
  pickCanonicalUrl,
  buildExtraction,
  parseResponseToForm,
} from "../src/lib/extract";

describe("trimPageText", () => {
  it("collapses whitespace and trims", () => {
    expect(trimPageText("  a\n\n\n b   c  ", 100)).toBe("a\n b c");
  });
  it("caps length", () => {
    expect(trimPageText("abcdef", 3)).toBe("abc");
  });
});

describe("pickCanonicalUrl", () => {
  it("prefers canonical, then og:url, then tab url", () => {
    expect(
      pickCanonicalUrl({ canonical: "https://c", ogUrl: "https://o", tabUrl: "https://t" })
    ).toBe("https://c");
    expect(
      pickCanonicalUrl({ canonical: null, ogUrl: "https://o", tabUrl: "https://t" })
    ).toBe("https://o");
    expect(
      pickCanonicalUrl({ canonical: null, ogUrl: null, tabUrl: "https://t" })
    ).toBe("https://t");
  });
  it("ignores non-http values", () => {
    expect(
      pickCanonicalUrl({ canonical: "javascript:void(0)", ogUrl: null, tabUrl: "https://t" })
    ).toBe("https://t");
  });
});

describe("buildExtraction", () => {
  it("combines title + body into capped text and resolves the url", () => {
    const result = buildExtraction(
      {
        title: "Senior Engineer at Acme",
        bodyText: "We are hiring a senior engineer...",
        canonical: "https://acme.com/jobs/123",
        ogUrl: null,
        tabUrl: "https://acme.com/search?q=eng",
      },
      10_000
    );
    expect(result.url).toBe("https://acme.com/jobs/123");
    expect(result.title).toBe("Senior Engineer at Acme");
    expect(result.text).toContain("Senior Engineer at Acme");
    expect(result.text).toContain("We are hiring");
  });
});

describe("parseResponseToForm", () => {
  it("fills fields from a parse response, nulls become empty strings", () => {
    const form = parseResponseToForm(
      { company: "Acme", role: "Engineer", location: null, salary_range: "$1", job_url: null },
      { jobUrl: "https://acme.com/jobs/123", title: "Senior Engineer at Acme", today: "2026-05-29" }
    );
    expect(form).toEqual({
      company: "Acme",
      role: "Engineer",
      location: "",
      salary_range: "$1",
      job_url: "https://acme.com/jobs/123",
      status: "Applied",
      date_applied: "2026-05-29",
      notes: "",
    });
  });

  it("falls back to a title-derived role guess when company/role are null", () => {
    const form = parseResponseToForm(
      { company: null, role: null, location: null, salary_range: null, job_url: null },
      { jobUrl: "https://acme.com/jobs/123", title: "Senior Engineer at Acme", today: "2026-05-29" }
    );
    expect(form.job_url).toBe("https://acme.com/jobs/123");
    expect(form.role).toBe("Senior Engineer at Acme"); // title used as a starting guess
    expect(form.company).toBe("");
  });
});
