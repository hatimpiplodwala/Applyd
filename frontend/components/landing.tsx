import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BrandMark } from "@/components/brand";
import { Button } from "@/components/ui/button";

export function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <TopNav />
      <main className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Hero />
        <Features />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
}

function TopNav() {
  return (
    <header className="relative z-10">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <BrandMark size="md" />
          <div className="flex flex-col">
            <span className="font-serif text-base font-medium tracking-tight">
              Applyd
            </span>
            <span className="eyebrow">Job tracker</span>
          </div>
        </Link>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Log in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/signup">Get started</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative pt-12 pb-10 sm:pt-16 sm:pb-12">
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <h1 className="text-balance font-serif text-4xl font-medium leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
          Track every application in one place.
        </h1>
        <p className="mt-4 max-w-lg text-balance text-base leading-relaxed text-ink-mid">
          Pipeline, kanban, analytics, and follow-up reminders for your job
          search.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" asChild>
            <Link href="/signup">
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </div>

      <div className="relative mt-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-12 -top-8 bottom-0 -z-10 bg-gradient-to-b from-primary/5 to-transparent blur-2xl"
        />
        <HeroPreview />
      </div>
    </section>
  );
}

function HeroPreview() {
  return (
    <div className="paper-shine relative mx-auto max-w-5xl overflow-hidden rounded-2xl border border-border bg-surface-raised p-2 shadow-paper-hover">
      <div className="flex gap-2">
        {/* Sidebar — matches stats-sidebar.tsx */}
        <aside className="hidden w-44 flex-shrink-0 flex-col rounded-xl border border-border bg-gloss-paper p-3 shadow-paper sm:flex">
          <div className="flex items-center gap-2">
            <BrandMark size="sm" />
            <div className="flex flex-col">
              <span className="font-serif text-xs font-medium leading-tight">
                Applyd
              </span>
              <span className="text-[7px] font-medium uppercase tracking-[0.12em] text-ink-soft">
                Job tracker
              </span>
            </div>
          </div>
          <div className="divider-soft mt-3" />
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            <MiniStat label="Total" value="24" />
            <MiniStat label="Active" value="11" accent />
          </div>
          <div className="paper-shine mt-2.5 rounded-md border border-border bg-surface-raised p-2 shadow-paper-raised">
            <p className="text-[7px] font-medium uppercase tracking-[0.12em] text-ink-soft">
              Last 14 days
            </p>
            <p className="mt-0.5 font-serif text-sm font-semibold tabular-nums">
              7
            </p>
            <div className="mt-1.5 flex h-6 items-end gap-[2px]">
              {[2, 1, 3, 0, 4, 2, 5, 1, 3, 2, 4, 6, 3, 5].map((n, i) => {
                const isToday = i === 13;
                const h = n === 0 ? 10 : Math.max(20, (n / 6) * 100);
                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-[2px] ${
                      isToday
                        ? "bg-primary shadow-forest-glow"
                        : i >= 7
                        ? "bg-gloss-forest"
                        : "bg-surface-sunken"
                    }`}
                    style={{ height: `${h}%` }}
                  />
                );
              })}
            </div>
          </div>
          <div className="divider-soft mt-3" />
          <div className="mt-3 space-y-2">
            <SidebarGroup
              label="Active"
              rows={[
                { name: "Applied", dot: "bg-status-applied-dot", n: 8 },
                { name: "Phone Screen", dot: "bg-status-screen-dot", n: 3 },
                { name: "Interview", dot: "bg-status-interview-dot", n: 0 },
              ]}
            />
          </div>
        </aside>

        {/* Main — matches dashboard-view.tsx */}
        <div className="min-w-0 flex-1 px-1 pt-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[7px] font-medium uppercase tracking-[0.12em] text-ink-soft">
                Dashboard
              </p>
              <h3 className="mt-0.5 font-serif text-base font-medium tracking-tight text-foreground sm:text-lg">
                Applications
              </h3>
              <p className="mt-0.5 text-[9px] text-ink-mid">
                Track everywhere you&apos;ve applied.
              </p>
            </div>
            <div className="flex gap-1">
              <div className="paper-shine rounded-md border border-border bg-surface-raised px-2 py-1 text-[9px] font-medium shadow-paper-raised">
                Export
              </div>
              <div className="rounded-md bg-gloss-forest px-2 py-1 text-[9px] font-medium text-primary-foreground shadow-forest-button">
                + Add
              </div>
            </div>
          </div>

          <div className="mt-2 inline-flex items-center gap-0.5 rounded-md border border-border bg-surface-sunken/60 p-0.5 shadow-inner-paper">
            <div className="paper-shine rounded bg-surface-raised px-2 py-0.5 text-[9px] font-medium shadow-paper-raised">
              Table
            </div>
            <div className="rounded px-2 py-0.5 text-[9px] text-ink-soft">
              Kanban
            </div>
            <div className="rounded px-2 py-0.5 text-[9px] text-ink-soft">
              Analytics
            </div>
          </div>

          <div className="mt-2 flex gap-1.5">
            <div className="flex w-32 items-center gap-1 rounded-md border border-input bg-surface-raised px-2 py-1 text-[9px] text-ink-soft shadow-inner-paper">
              All statuses
            </div>
            <div className="flex flex-1 items-center gap-1 rounded-md border border-input bg-surface-raised px-2 py-1 text-[9px] text-ink-soft shadow-inner-paper">
              Search company or role…
            </div>
          </div>

          <div className="paper-shine relative mt-2 overflow-hidden rounded-lg border border-border bg-card shadow-paper-raised">
            <div className="grid grid-cols-12 gap-1 border-b border-border bg-surface-sunken/60 px-3 py-1.5 text-[8px] font-medium uppercase tracking-[0.1em] text-ink-soft">
              <span className="col-span-4">Company</span>
              <span className="col-span-4">Role</span>
              <span className="col-span-2">Status</span>
              <span className="col-span-2">Applied</span>
            </div>
            {SAMPLE_ROWS.map((row, i) => (
              <div
                key={i}
                className={`relative grid grid-cols-12 items-center gap-1 border-b border-border/60 px-3 py-2 pl-4 text-[10px] last:border-0 before:absolute before:left-0 before:top-0 before:h-full before:w-[3px] before:opacity-70 ${row.accentCls}`}
              >
                <span className="col-span-4 truncate font-medium text-foreground">
                  {row.company}
                </span>
                <span className="col-span-4 truncate text-ink-mid">
                  {row.role}
                </span>
                <span className="col-span-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[8px] ${row.statusCls}`}
                  >
                    <span className={`h-1 w-1 rounded-full ${row.dotCls}`} />
                    {row.status}
                  </span>
                </span>
                <span className="col-span-2 tabular-nums text-ink-soft">
                  {row.date}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`paper-shine relative overflow-hidden rounded-md border px-1.5 py-1 ${
        accent
          ? "border-primary/40 bg-gloss-forest text-primary-foreground shadow-forest-button"
          : "border-border bg-surface-raised shadow-paper"
      }`}
    >
      <p
        className={`text-[7px] font-medium uppercase tracking-[0.1em] ${
          accent ? "text-primary-foreground/80" : "text-ink-soft"
        }`}
      >
        {label}
      </p>
      <p
        className={`font-serif text-sm font-semibold tabular-nums ${
          accent ? "text-primary-foreground" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function SidebarGroup({
  label,
  rows,
}: {
  label: string;
  rows: { name: string; dot: string; n: number }[];
}) {
  const subtotal = rows.reduce((s, r) => s + r.n, 0);
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-[7px] font-medium uppercase tracking-[0.12em] text-ink-soft">
          {label}
        </p>
        <span className="text-[8px] tabular-nums text-ink-soft">{subtotal}</span>
      </div>
      <ul className="mt-1 space-y-0.5">
        {rows.map((r) => (
          <li
            key={r.name}
            className="flex items-center justify-between px-1 text-[9px]"
          >
            <span className="flex items-center gap-1.5 text-ink-mid">
              <span className={`h-1.5 w-1.5 rounded-full ${r.dot}`} />
              {r.name}
            </span>
            <span className="tabular-nums text-ink-soft">{r.n}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const SAMPLE_ROWS = [
  {
    company: "Vercel",
    role: "Senior Frontend Engineer",
    status: "Interview",
    statusCls:
      "border-status-interview-border bg-status-interview-bg text-status-interview-fg",
    dotCls: "bg-status-interview-dot",
    accentCls: "before:bg-status-interview-dot",
    date: "May 18",
  },
  {
    company: "Linear",
    role: "Product Engineer",
    status: "Phone Screen",
    statusCls:
      "border-status-screen-border bg-status-screen-bg text-status-screen-fg",
    dotCls: "bg-status-screen-dot",
    accentCls: "before:bg-status-screen-dot",
    date: "May 14",
  },
  {
    company: "Anthropic",
    role: "Software Engineer, ML",
    status: "Applied",
    statusCls:
      "border-status-applied-border bg-status-applied-bg text-status-applied-fg",
    dotCls: "bg-status-applied-dot",
    accentCls: "before:bg-status-applied-dot",
    date: "May 11",
  },
  {
    company: "Stripe",
    role: "Full-Stack Engineer",
    status: "Offer",
    statusCls: "border-status-offer-border bg-status-offer-bg text-status-offer-fg",
    dotCls: "bg-status-offer-dot",
    accentCls: "before:bg-status-offer-dot",
    date: "May 4",
  },
];

function Features() {
  return (
    <section className="relative pt-2 pb-12 sm:pt-4 sm:pb-16">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">Features</p>
        <h2 className="mt-2 text-balance font-serif text-2xl font-medium leading-tight tracking-tight sm:text-3xl">
          Built for tracking a job search.
        </h2>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
        <FeatureCard
          title="Drag-and-drop kanban"
          body="Move applications across stages. Updates are optimistic so the board feels instant."
          preview={<KanbanPreview />}
        />
        <FeatureCard
          title="Pipeline analytics"
          body="Conversion from Applied through Offer, monthly volume, and outcomes split out from the active pipeline."
          preview={<FunnelPreview />}
        />
        <FeatureCard
          title="Follow-up reminders"
          body="Set a follow-up date when you apply. Email reminders go out the morning of."
          preview={<ReminderPreview />}
        />
      </div>
    </section>
  );
}

function FeatureCard({
  title,
  body,
  preview,
}: {
  title: string;
  body: string;
  preview: React.ReactNode;
}) {
  return (
    <div className="paper-shine flex flex-col rounded-xl border border-border bg-surface-raised p-4 shadow-paper-raised transition-shadow hover:shadow-paper-hover">
      <h3 className="font-serif text-base font-medium text-ink">{title}</h3>
      <p className="mt-1.5 text-[13px] leading-relaxed text-ink-mid">{body}</p>
      <div className="mt-4 flex-1">{preview}</div>
    </div>
  );
}

function KanbanPreview() {
  const cols = [
    { name: "Applied", count: 8, dot: "bg-status-applied-dot" },
    { name: "Screen", count: 3, dot: "bg-status-screen-dot" },
    { name: "Offer", count: 1, dot: "bg-status-offer-dot" },
  ];
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {cols.map((c) => (
        <div
          key={c.name}
          className="rounded-md border border-border bg-surface p-1.5"
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-[9px] font-medium text-ink-mid">
              <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
              {c.name}
            </span>
            <span className="text-[9px] tabular-nums text-ink-soft">
              {c.count}
            </span>
          </div>
          <div className="mt-1.5 space-y-1">
            <div className="paper-shine rounded border border-border bg-surface-raised px-1.5 py-1 shadow-paper">
              <div className="h-1 w-3/4 rounded bg-surface-sunken" />
              <div className="mt-1 h-1 w-1/2 rounded bg-surface-sunken/70" />
            </div>
            <div className="paper-shine rounded border border-border bg-surface-raised px-1.5 py-1 shadow-paper">
              <div className="h-1 w-2/3 rounded bg-surface-sunken" />
              <div className="mt-1 h-1 w-2/5 rounded bg-surface-sunken/70" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FunnelPreview() {
  const stages = [
    { label: "Applied", pct: 100, n: 24 },
    { label: "Screen", pct: 50, n: 12 },
    { label: "Interview", pct: 29, n: 7 },
    { label: "Offer", pct: 8, n: 2 },
  ];
  return (
    <div className="space-y-1.5">
      {stages.map((s) => (
        <div key={s.label} className="flex items-center gap-2">
          <span className="w-14 text-[9px] text-ink-soft">{s.label}</span>
          <div className="relative h-3 flex-1 overflow-hidden rounded bg-surface-sunken shadow-inner-paper">
            <div
              className="paper-shine relative h-full rounded bg-gloss-forest"
              style={{ width: `${s.pct}%` }}
            />
          </div>
          <span className="w-4 text-right text-[9px] tabular-nums text-ink-mid">
            {s.n}
          </span>
        </div>
      ))}
    </div>
  );
}

function ReminderPreview() {
  return (
    <div className="space-y-2">
      <div className="paper-shine rounded-md border border-status-screen-border bg-status-screen-bg/60 p-2.5">
        <span className="text-[10px] font-medium text-status-screen-fg">
          Follow up today
        </span>
        <p className="mt-1 text-[11px] font-medium text-ink">
          Vercel &middot; Senior Frontend Engineer
        </p>
        <p className="text-[10px] text-ink-soft">Applied 5 days ago</p>
      </div>
      <div className="rounded-md border border-border bg-surface p-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-ink-soft">In 3 days</span>
          <span className="text-[10px] tabular-nums text-ink-soft">May 26</span>
        </div>
        <p className="mt-1 text-[11px] text-ink-mid">
          Linear &middot; Product Engineer
        </p>
      </div>
    </div>
  );
}

function CallToAction() {
  return (
    <section className="relative pb-16 sm:pb-20">
      <div className="paper-shine relative overflow-hidden rounded-2xl border border-border bg-gloss-cream p-7 text-center shadow-paper-hover sm:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 left-1/2 h-64 w-[600px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
        />
        <div className="relative">
          <h2 className="text-balance font-serif text-xl font-medium leading-tight tracking-tight sm:text-2xl">
            Start tracking your applications.
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-mid">
            Free to use. No credit card required.
          </p>
          <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/signup">
                Create an account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/login">Already have an account? Sign in</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-ink-soft sm:flex-row sm:px-6 lg:px-8">
        <span>Applyd</span>
        <span>&copy; {new Date().getFullYear()} Applyd</span>
      </div>
    </footer>
  );
}
