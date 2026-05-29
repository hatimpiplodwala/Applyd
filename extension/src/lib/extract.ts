import type { ParsedJob, Status } from "./types";

export interface RawExtraction {
  title: string;
  bodyText: string;
  canonical: string | null;
  ogUrl: string | null;
  tabUrl: string;
}

export interface Extraction {
  url: string;
  title: string;
  text: string;
}

export interface FormState {
  company: string;
  role: string;
  location: string;
  status: Status;
  date_applied: string;
  job_url: string;
  salary_range: string;
  notes: string;
}

function isHttp(value: string | null): value is string {
  return !!value && /^https?:\/\//i.test(value);
}

export function trimPageText(raw: string, cap: number): string {
  const collapsed = raw
    .trim()
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trimEnd())
    .filter((line) => line.length > 0)
    .join("\n");
  return collapsed.slice(0, cap);
}

export function pickCanonicalUrl(input: {
  canonical: string | null;
  ogUrl: string | null;
  tabUrl: string;
}): string {
  if (isHttp(input.canonical)) return input.canonical;
  if (isHttp(input.ogUrl)) return input.ogUrl;
  return input.tabUrl;
}

// Keep well under the backend's MAX_PASTED_TEXT_CHARS (50_000).
export const TEXT_CAP = 40_000;

export function buildExtraction(raw: RawExtraction, cap: number = TEXT_CAP): Extraction {
  const url = pickCanonicalUrl(raw);
  const text = trimPageText(`${raw.title}\n${raw.bodyText}`, cap);
  return { url, title: raw.title, text };
}

export function parseResponseToForm(
  parsed: ParsedJob,
  ctx: { jobUrl: string; title: string; today: string }
): FormState {
  return {
    company: parsed.company ?? "",
    role: parsed.role ?? ctx.title,
    location: parsed.location ?? "",
    status: "Applied",
    date_applied: ctx.today,
    job_url: isHttp(parsed.job_url) ? parsed.job_url : ctx.jobUrl,
    salary_range: parsed.salary_range ?? "",
    notes: "",
  };
}

// Used when parsing fails entirely — open the form with what we know.
export function fallbackForm(ctx: {
  jobUrl: string;
  title: string;
  today: string;
}): FormState {
  return parseResponseToForm(
    { company: null, role: null, location: null, salary_range: null, job_url: null },
    ctx
  );
}
