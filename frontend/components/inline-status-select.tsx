"use client";

import { StatusBadge } from "@/components/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { STATUSES, type Status } from "@/lib/types";

export function InlineStatusSelect({
  status,
  onChange,
  label,
}: {
  status: Status;
  onChange: (next: Status) => void;
  label: string;
}) {
  return (
    <Select value={status} onValueChange={(v) => onChange(v as Status)}>
      <SelectTrigger
        aria-label={`Change status for ${label}`}
        className="h-auto w-auto border-0 bg-transparent p-0 shadow-none hover:opacity-80 focus:ring-0 [&>span]:line-clamp-none [&>svg]:hidden"
      >
        <span>
          <StatusBadge status={status} />
        </span>
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {s}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
