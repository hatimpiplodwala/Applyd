import type { Status } from "@/lib/types";

const STYLES: Record<Status, string> = {
  Applied:
    "bg-status-applied-bg text-status-applied-fg border-status-applied-border",
  "Phone Screen":
    "bg-status-screen-bg text-status-screen-fg border-status-screen-border",
  Interview:
    "bg-status-interview-bg text-status-interview-fg border-status-interview-border",
  Offer:
    "bg-status-offer-bg text-status-offer-fg border-status-offer-border",
  Rejected:
    "bg-status-rejected-bg text-status-rejected-fg border-status-rejected-border",
  Withdrawn:
    "bg-status-withdrawn-bg text-status-withdrawn-fg border-status-withdrawn-border",
};

const DOTS: Record<Status, string> = {
  Applied: "bg-status-applied-dot",
  "Phone Screen": "bg-status-screen-dot",
  Interview: "bg-status-interview-dot",
  Offer: "bg-status-offer-dot",
  Rejected: "bg-status-rejected-dot",
  Withdrawn: "bg-status-withdrawn-dot",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${STYLES[status]}`}
    >
      <span className={`dot ${DOTS[status]}`} aria-hidden />
      {status}
    </span>
  );
}

export function StatusDot({ status }: { status: Status }) {
  return <span className={`dot ${DOTS[status]}`} aria-hidden />;
}
