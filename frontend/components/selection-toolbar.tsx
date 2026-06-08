"use client";

import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUSES, type Status } from "@/lib/types";

export function SelectionToolbar({
  count,
  onStatus,
  onDelete,
  onClear,
}: {
  count: number;
  onStatus: (status: Status) => void;
  onDelete: () => void;
  onClear: () => void;
}) {
  return (
    <div className="animate-fade-in fixed inset-x-0 bottom-20 z-40 flex justify-center px-4">
      <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-raised px-4 py-2.5 text-sm shadow-paper-raised">
        <span className="font-medium text-foreground">{count} selected</span>
        <div className="flex items-center gap-2">
        <Select onValueChange={(v) => onStatus(v as Status)}>
          <SelectTrigger className="h-8 w-[150px] text-xs">
            <SelectValue placeholder="Change status…" />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          aria-label="Clear selection"
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
        </div>
      </div>
    </div>
  );
}
