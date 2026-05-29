import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrandMark } from "@/components/brand";

export const metadata: Metadata = {
  title: "Privacy Policy — Applyd",
  description:
    "How Applyd and the Applyd browser extension handle your data.",
};

const LAST_UPDATED = "May 29, 2026";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="mb-10 flex items-center gap-3">
        <BrandMark size="md" />
        <span className="font-serif text-2xl font-medium tracking-tight">
          Applyd
        </span>
      </div>

      <h1 className="font-serif text-3xl font-medium tracking-tight">
        Privacy Policy
      </h1>
      <p className="mt-1.5 text-sm text-ink-soft">Last updated {LAST_UPDATED}</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-ink-mid">
        <p>
          Applyd helps you track your job applications. This policy explains
          what data Applyd and the Applyd browser extension process, and what we
          do and don&apos;t do with it.
        </p>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium tracking-tight text-foreground">
            Data we process
          </h2>
          <ul className="space-y-2">
            <li>
              <strong className="font-medium text-foreground">
                Account email and password
              </strong>{" "}
              you enter to sign in, sent only to Applyd&apos;s authentication
              provider (Supabase) to log you in.
            </li>
            <li>
              <strong className="font-medium text-foreground">
                Job posting text
              </strong>{" "}
              from a page you choose to save, sent only to Applyd&apos;s own API
              to extract the company, role, location, and salary.
            </li>
            <li>
              <strong className="font-medium text-foreground">
                The applications you save
              </strong>
              , stored in your Applyd account.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium tracking-tight text-foreground">
            The browser extension
          </h2>
          <p>
            The Applyd extension reads the text of the job posting on your
            current tab only when you open the popup or use the &ldquo;Save Job
            to Applyd&rdquo; right-click menu. It keeps you signed in between
            sessions and contacts no servers other than Applyd&apos;s own API
            and authentication provider. It does not read or collect data from
            any other site.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium tracking-tight text-foreground">
            What we don&apos;t do
          </h2>
          <p>
            Applyd does not use analytics or trackers, and does not sell or
            share your data with third parties. The only services your data
            reaches are Applyd&apos;s own API and its authentication provider
            (Supabase), both used to operate the product.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium tracking-tight text-foreground">
            Your data and deletion
          </h2>
          <p>
            You can delete saved applications anytime from the Applyd web app.
            To delete your account and all associated data, contact us at the
            address below.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium tracking-tight text-foreground">
            Contact
          </h2>
          <p>
            Questions about this policy? Email{" "}
            <a
              href="mailto:hpiplodwala110@gmail.com"
              className="font-medium text-primary hover:underline"
            >
              hpiplodwala110@gmail.com
            </a>
            .
          </p>
        </section>
      </div>

      <div className="mt-12 border-t border-border pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Applyd
        </Link>
      </div>
    </div>
  );
}
