import type { ReactNode } from "react";

type Size = "sm" | "md" | "lg";

const BOX: Record<Size, number> = { sm: 20, md: 26, lg: 32 };
const ICON: Record<Size, number> = { sm: 12, md: 15, lg: 18 };

/** The forest "checklist" logo box — mirrors the web app's BrandMark. */
export function BrandMark({
  size = "md",
  tone = "brand",
}: {
  size?: Size;
  tone?: "brand" | "muted";
}) {
  const box = BOX[size];
  const icon = ICON[size];
  return (
    <span
      className={`brand-mark${tone === "muted" ? " brand-mark-muted" : ""}`}
      style={{ width: box, height: box }}
    >
      {tone === "brand" && <span aria-hidden className="brand-mark-sheen" />}
      <ChecklistIcon size={icon} />
    </span>
  );
}

function ChecklistIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      width={size}
      height={size}
      className={`brand-icon${className ? ` ${className}` : ""}`}
    >
      <path d="m3 17 2 2 4-4" />
      <path d="m3 7 2 2 4-4" />
      <path d="M13 6h8" />
      <path d="M13 12h8" />
      <path d="M13 18h8" />
    </svg>
  );
}

/** Logo + "Applyd" wordmark, with optional subtitle and a right-aligned slot. */
export function BrandHeader({
  subtitle,
  right,
  size = "md",
}: {
  subtitle?: string;
  right?: ReactNode;
  size?: Size;
}) {
  return (
    <div className="row between">
      <div className="brand-row">
        <BrandMark size={size} />
        <div className="brand-text">
          <span className="brand">Applyd</span>
          {subtitle && <span className="brand-subtitle">{subtitle}</span>}
        </div>
      </div>
      {right}
    </div>
  );
}

/** Branded loading state: the checklist strokes draw themselves in on a loop. */
export function BrandLoader({ label }: { label: string }) {
  return (
    <div className="loader">
      <span className="brand-mark brand-mark-lg loader-mark">
        <span aria-hidden className="brand-mark-sheen" />
        <ChecklistIcon size={20} className="brand-icon-draw" />
      </span>
      <span className="loader-label">{label}</span>
    </div>
  );
}
