export type Status =
  | "Applied"
  | "Phone Screen"
  | "Interview"
  | "Offer"
  | "Rejected"
  | "Withdrawn";

export const STATUSES: Status[] = [
  "Applied",
  "Phone Screen",
  "Interview",
  "Offer",
  "Rejected",
  "Withdrawn",
];

// Fields the extension can set when creating an application.
export interface ApplicationInput {
  company: string;
  role: string;
  location: string | null;
  status: Status;
  date_applied: string; // YYYY-MM-DD
  job_url: string | null;
  salary_range: string | null;
  notes: string | null;
}

export interface ParsedJob {
  company: string | null;
  role: string | null;
  location: string | null;
  salary_range: string | null;
  job_url: string | null;
}
