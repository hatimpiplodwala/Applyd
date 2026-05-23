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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = {
    "Content-Type": "application/json",
    ...(await authHeader()),
    ...(init?.headers ?? {}),
  };
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
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
