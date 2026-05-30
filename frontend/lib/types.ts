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

export const ACTIVE_STATUSES: Status[] = ["Applied", "Phone Screen", "Interview"];
export const CLOSED_STATUSES: Status[] = ["Offer", "Rejected", "Withdrawn"];

export interface Application {
  id: string;
  user_id: string;
  company: string;
  role: string;
  location: string | null;
  status: Status;
  date_applied: string;
  job_url: string | null;
  salary_range: string | null;
  contact_name: string | null;
  notes: string | null;
  follow_up_date: string | null;
  created_at: string;
  updated_at: string;
}

export type ApplicationInput = Omit<
  Application,
  "id" | "user_id" | "created_at" | "updated_at"
>;
