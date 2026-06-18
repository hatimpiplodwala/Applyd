import { createClient } from "@/lib/supabase/client";
import type { Application, ApplicationInput } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function authHeader(): Promise<Record<string, string>> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");
  return { Authorization: `Bearer ${session.access_token}` };
}

// Pull a clean, human-readable message out of an error response instead of
// surfacing the raw body. The backend speaks FastAPI ({detail: "..."} or a
// pydantic {detail: [{msg}]}) and slowapi ({error: "..."}); anything else falls
// back to the status so users never see a JSON envelope or an HTML error page.
async function errorMessage(res: Response): Promise<string> {
  const fallback = `Request failed (${res.status})`;
  let body: string;
  try {
    body = await res.text();
  } catch {
    return fallback;
  }
  try {
    const data = JSON.parse(body);
    const detail = data?.detail ?? data?.error;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && typeof detail[0]?.msg === "string") {
      return detail[0].msg;
    }
  } catch {
    // Not JSON — use the fallback rather than dumping the raw body.
  }
  return fallback;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = {
    "Content-Type": "application/json",
    ...(await authHeader()),
    ...(init?.headers ?? {}),
  };
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!res.ok) throw new Error(await errorMessage(res));
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  listApplications: () => request<Application[]>("/applications"),
  createApplication: (input: ApplicationInput) =>
    request<Application>("/applications", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateApplication: (id: string, input: Partial<ApplicationInput>) =>
    request<Application>(`/applications/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  deleteApplication: (id: string) =>
    request<void>(`/applications/${id}`, { method: "DELETE" }),
  duplicateCheck: (company: string, role: string, excludeId?: string) => {
    const params = new URLSearchParams({ company, role });
    if (excludeId) params.set("exclude_id", excludeId);
    return request<{ exists: boolean }>(
      `/applications/duplicate-check?${params}`
    );
  },
  parseJob: (input: { url?: string; text?: string }) =>
    request<ParsedJob>("/applications/parse-url", {
      method: "POST",
      body: JSON.stringify(input),
    }),
};

export interface ParsedJob {
  company: string | null;
  role: string | null;
  location: string | null;
  salary_range: string | null;
  job_url: string | null;
}
