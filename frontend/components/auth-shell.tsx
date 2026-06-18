import { BrandMark } from "@/components/brand";

/**
 * Centered card scaffold shared by every auth page (login, signup, forgot, and
 * reset password): the brand header, title, and subtitle around a form card.
 * `wordmark` shows the "Applyd" lockup next to the mark (login/signup) vs. the
 * mark alone (forgot/reset).
 */
export function AuthShell({
  title,
  subtitle,
  wordmark = false,
  children,
}: {
  title: string;
  subtitle: string;
  wordmark?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          {wordmark ? (
            <div className="flex items-center gap-3">
              <BrandMark size="lg" />
              <span className="font-serif text-4xl font-medium tracking-tight text-foreground">
                Applyd
              </span>
            </div>
          ) : (
            <BrandMark size="lg" />
          )}
          <h1
            className={`font-serif font-medium tracking-tight ${
              wordmark ? "mt-6 text-2xl" : "mt-4 text-3xl"
            }`}
          >
            {title}
          </h1>
          <p className="mt-1.5 text-sm text-ink-mid">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
