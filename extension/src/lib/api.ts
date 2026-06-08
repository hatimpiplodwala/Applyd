import { config } from "./config";
import { getValidAccessToken } from "./auth";
import type { ApplicationInput, ParsedJob } from "./types";

// Turn a non-OK response into a message worth showing a human. FastAPI puts the
// reason in a JSON `detail` (string, or an array of validation errors); fall
// back to a friendly line per status so we never surface raw JSON.
export function friendlyError(status: number, body: string): string {
  let detail = "";
  try {
    const parsed = JSON.parse(body);
    if (typeof parsed?.detail === "string") {
      detail = parsed.detail;
    } else if (Array.isArray(parsed?.detail)) {
      detail = parsed.detail
        .map((d: { msg?: string }) => d?.msg)
        .filter(Boolean)
        .join("; ");
    }
  } catch {
    // Body wasn't JSON — ignore and use the status-based message below.
  }
  if (status === 429)
    return "You're going a bit fast — wait a moment and try again.";
  if (status === 401 || status === 403)
    return "Your session expired. Please sign in again.";
  if (status >= 500)
    return "Applyd's server hit a problem. Try again in a moment.";
  return detail || `Something went wrong (HTTP ${status}).`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getValidAccessToken();
  let res: Response;
  try {
    res = await fetch(`${config.apiUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new Error("Couldn't reach Applyd. Check your connection and try again.");
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(friendlyError(res.status, text));
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
