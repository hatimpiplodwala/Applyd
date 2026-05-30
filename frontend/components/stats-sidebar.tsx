"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, LogOut, TrendingDown, TrendingUp, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { countByStatus } from "@/lib/applications";
import { toLocalIso } from "@/lib/utils";
import {
  ACTIVE_STATUSES,
  CLOSED_STATUSES,
  type Application,
  type Status,
} from "@/lib/types";
import { BrandMark } from "@/components/brand";
import { StatusDot } from "@/components/status-badge";
import { Button } from "@/components/ui/button";

interface StatsSidebarProps {
  email: string;
  applications: Application[];
}

const DAYS = 14;

export function StatsSidebar({ email, applications }: StatsSidebarProps) {
  const router = useRouter();

  const total = applications.length;

  const breakdown = useMemo(
    () => countByStatus(applications),
    [applications]
  );

  const active = ACTIVE_STATUSES.reduce((sum, s) => sum + breakdown[s], 0);

  const activity = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const buckets: { key: string; count: number }[] = [];
    const idx = new Map<string, number>();
    for (let i = DAYS - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = toLocalIso(d);
      idx.set(key, buckets.length);
      buckets.push({ key, count: 0 });
    }

    for (const a of applications) {
      const key = a.date_applied.slice(0, 10);
      const i = idx.get(key);
      if (i !== undefined) buckets[i].count++;
    }

    const thisWeek = buckets.slice(7).reduce((s, b) => s + b.count, 0);
    const lastWeek = buckets.slice(0, 7).reduce((s, b) => s + b.count, 0);
    const max = Math.max(1, ...buckets.map((b) => b.count));

    return { buckets, thisWeek, lastWeek, max };
  }, [applications]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* Mobile: compact top bar */}
      <header className="flex w-full items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <BrandMark size="sm" />
          <h1 className="font-serif text-base font-medium tracking-tight">Applyd</h1>
        </div>
        <div className="flex items-center gap-2">
          <InlineStat label="Total" value={total} />
          <InlineStat label="Active" value={active} accent />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            aria-label="Log out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Desktop: vertical sidebar */}
      <aside className="hidden h-screen w-64 flex-col overflow-y-auto border-r border-border bg-gloss-paper px-5 py-6 shadow-paper md:flex md:sticky md:top-0">
        <div className="flex items-center gap-2.5">
          <BrandMark size="md" />
          <div className="flex flex-col">
            <h1 className="font-serif text-base font-medium tracking-tight text-foreground">
              Applyd
            </h1>
            <p className="text-[10px] uppercase tracking-wider text-ink-soft">
              Job tracker
            </p>
          </div>
        </div>

        <div className="divider-soft mt-6" />

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Stat
            label="Total"
            value={total}
            icon={<Briefcase className="h-3.5 w-3.5" />}
          />
          <Stat
            label="Active"
            value={active}
            accent
            icon={<Zap className="h-3.5 w-3.5" />}
          />
        </div>

        {total > 0 && (
          <ActivityCard
            buckets={activity.buckets}
            thisWeek={activity.thisWeek}
            lastWeek={activity.lastWeek}
            max={activity.max}
          />
        )}

        {total > 0 && (
          <>
            <div className="divider-soft mt-6" />
            <div className="mt-6 space-y-4">
              <StatusGroup
                label="Active"
                statuses={ACTIVE_STATUSES}
                counts={breakdown}
              />
              <StatusGroup
                label="Closed"
                statuses={CLOSED_STATUSES}
                counts={breakdown}
              />
            </div>
          </>
        )}

        <div className="mt-auto">
          <div className="divider-soft mb-4" />
          <div className="mb-3 space-y-0.5">
            <p className="eyebrow">Signed in</p>
            <p className="truncate text-xs text-ink-mid" title={email}>
              {email}
            </p>
          </div>
          <Button variant="secondary" onClick={handleLogout} className="w-full">
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>
      </aside>
    </>
  );
}

function ActivityCard({
  buckets,
  thisWeek,
  lastWeek,
  max,
}: {
  buckets: { key: string; count: number }[];
  thisWeek: number;
  lastWeek: number;
  max: number;
}) {
  const delta = thisWeek - lastWeek;
  const noTrend = thisWeek === 0 && lastWeek === 0;
  const TrendIcon = delta >= 0 ? TrendingUp : TrendingDown;
  const trendColor =
    noTrend
      ? "text-ink-soft"
      : delta > 0
      ? "text-status-offer-fg"
      : delta < 0
      ? "text-status-rejected-fg"
      : "text-ink-soft";

  return (
    <div className="paper-shine relative mt-6 overflow-hidden rounded-lg border border-border bg-surface-raised px-3 py-3 shadow-paper-raised">
      <div className="flex items-center justify-between">
        <p className="eyebrow">Last 14 days</p>
        {!noTrend && (
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-medium ${trendColor}`}
            title={`Last week: ${lastWeek}`}
          >
            <TrendIcon className="h-3 w-3" />
            {delta > 0 ? "+" : ""}
            {delta}
          </span>
        )}
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <p className="font-serif text-2xl font-semibold tabular-nums text-foreground">
          {thisWeek}
        </p>
        <p className="text-[11px] text-ink-soft">this week</p>
      </div>
      <div
        className="mt-3 flex h-10 items-end gap-[3px]"
        role="img"
        aria-label={`Daily applications over the last ${DAYS} days`}
      >
        {buckets.map((b, i) => {
          const isThisWeek = i >= 7;
          const isToday = i === buckets.length - 1;
          const height = b.count === 0 ? 6 : Math.max(10, (b.count / max) * 100);
          const cls = isToday
            ? "bg-primary shadow-forest-glow ring-1 ring-primary/40"
            : isThisWeek
            ? "bg-gloss-forest"
            : "bg-surface-sunken";
          return (
            <div
              key={b.key}
              className={`flex-1 rounded-sm transition-all ${cls}`}
              style={{ height: `${height}%` }}
              title={`${b.key}: ${b.count}`}
            />
          );
        })}
      </div>
    </div>
  );
}

function StatusGroup({
  label,
  statuses,
  counts,
}: {
  label: string;
  statuses: Status[];
  counts: Record<Status, number>;
}) {
  const subtotal = statuses.reduce((s, st) => s + counts[st], 0);
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <p className="eyebrow">{label}</p>
        <span className="text-[11px] tabular-nums text-ink-soft">
          {subtotal}
        </span>
      </div>
      <ul className="space-y-0.5">
        {statuses.map((s) => (
          <li
            key={s}
            className="flex items-center justify-between rounded px-2 py-1 text-xs transition-colors hover:bg-surface-sunken/60"
          >
            <span className="flex items-center gap-2 text-ink-mid">
              <StatusDot status={s} />
              {s}
            </span>
            <span className="tabular-nums text-ink-soft">{counts[s]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: number;
  accent?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={`paper-shine relative overflow-hidden rounded-lg border px-3 py-3 transition-all ${
        accent
          ? "border-primary/40 bg-gloss-forest text-primary-foreground shadow-forest-button hover:shadow-forest-button-hover"
          : "border-border bg-surface-raised shadow-paper-raised hover:shadow-paper-hover"
      }`}
    >
      <div
        className={`flex items-center gap-1.5 ${
          accent ? "text-primary-foreground/80" : "text-ink-soft"
        }`}
      >
        {icon}
        <p
          className={`text-[11px] font-medium uppercase tracking-[0.12em] ${
            accent ? "text-primary-foreground/80" : "text-ink-soft"
          }`}
        >
          {label}
        </p>
      </div>
      <p
        className={`mt-1 font-serif text-2xl font-semibold tabular-nums ${
          accent ? "text-primary-foreground" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function InlineStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-1 rounded-md border border-border bg-surface-raised px-2 py-1 shadow-inner-paper">
      <span className="text-[10px] font-medium uppercase tracking-wider text-ink-soft">
        {label}
      </span>
      <span
        className={`text-sm font-semibold tabular-nums ${
          accent ? "text-primary" : "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
