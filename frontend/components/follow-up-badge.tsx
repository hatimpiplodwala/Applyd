import { Calendar } from "lucide-react";
import { cn, daysUntil } from "@/lib/utils";

/** Colored "follow up in/overdue/today" pill shared by the table and kanban. */
export function FollowUpBadge({
  date,
  className,
}: {
  date: string;
  className?: string;
}) {
  const days = daysUntil(date);
  const overdue = days < 0;
  const soon = days >= 0 && days <= 2;
  const tone = overdue
    ? "border-status-rejected-border bg-status-rejected-bg text-status-rejected-fg"
    : soon
    ? "border-status-screen-border bg-status-screen-bg text-status-screen-fg"
    : "border-border bg-surface-sunken text-ink-soft";
  const label = overdue
    ? `Follow up overdue ${Math.abs(days)}d`
    : days === 0
    ? "Follow up today"
    : `Follow up in ${days}d`;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px]",
        tone,
        className
      )}
    >
      <Calendar className="h-2.5 w-2.5" />
      {label}
    </span>
  );
}
