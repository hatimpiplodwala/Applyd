import { AlertCircle } from "lucide-react";

/** Inline error banner shared by the auth pages and the application form. */
export function FormError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-md border border-status-rejected-border bg-status-rejected-bg px-3 py-2 text-sm text-status-rejected-fg"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}
