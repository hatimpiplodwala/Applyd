"use client";

import { FilePlus2, Link2, Puzzle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyOnboarding({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-8 text-center sm:p-12">
      <h3 className="font-serif text-xl font-medium tracking-tight text-foreground">
        Track your first application
      </h3>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-ink-mid">
        Three ways to get a job into Applyd — start with whichever is easiest.
      </p>

      <div className="mx-auto mt-8 grid max-w-2xl gap-3 text-left sm:grid-cols-3">
        <Step
          icon={<Link2 className="h-4 w-4" />}
          title="Paste a link"
          body="Drop a job URL and let AI fill in the company, role, and salary."
        />
        <Step
          icon={<FilePlus2 className="h-4 w-4" />}
          title="Add manually"
          body="Type the details in yourself — takes about ten seconds."
        />
        <Step
          icon={<Puzzle className="h-4 w-4" />}
          title="Use the extension"
          body="Save the posting you're viewing with one click, auto-filled."
        />
      </div>

      <div className="mt-8">
        <Button size="lg" onClick={onAdd}>
          Add your first application
        </Button>
      </div>
    </div>
  );
}

function Step({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface-raised p-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface text-primary">
        {icon}
      </div>
      <p className="mt-3 text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-ink-soft">{body}</p>
    </div>
  );
}
