"use client";

import { type Ref } from "react";
import { Filter, Search, X } from "lucide-react";
import { STATUSES, type Status } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type StatusFilter = Status | "All";

interface FilterBarProps {
  status: StatusFilter;
  search: string;
  searchRef?: Ref<HTMLInputElement>;
  onStatusChange: (status: StatusFilter) => void;
  onSearchChange: (search: string) => void;
  onClear: () => void;
}

export function FilterBar({
  status,
  search,
  searchRef,
  onStatusChange,
  onSearchChange,
  onClear,
}: FilterBarProps) {
  const active = status !== "All" || search.trim().length > 0;
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative sm:w-52">
        <Filter
          className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-ink-soft"
          aria-hidden
        />
        <Select
          value={status}
          onValueChange={(v) => onStatusChange(v as StatusFilter)}
        >
          <SelectTrigger
            aria-label="Filter by status"
            className="pl-9"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft"
          aria-hidden
        />
        <Input
          ref={searchRef}
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search company or role…  ( / )"
          className="pl-9"
          aria-label="Search applications"
        />
      </div>
      {active && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-ink-soft hover:text-foreground sm:flex-shrink-0"
        >
          <X className="h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
}
