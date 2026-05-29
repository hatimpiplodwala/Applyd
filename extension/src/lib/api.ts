import { config } from "./config";
import { getValidAccessToken } from "./auth";
import type { ApplicationInput, ParsedJob } from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getValidAccessToken();
  const res = await fetch(`${config.apiUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  // Sends rendered page text to the AI parser's text mode.
  parseJobFromText: (text: string) =>
    request<ParsedJob>("/applications/parse-url", {
      method: "POST",
      body: JSON.stringify({ text }),
    }),

  createApplication: (input: ApplicationInput) =>
    request<{ id: string }>("/applications", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  duplicateCheck: (company: string, role: string) => {
    const params = new URLSearchParams({ company, role });
    return request<{ exists: boolean }>(
      `/applications/duplicate-check?${params}`
    );
  },
};
