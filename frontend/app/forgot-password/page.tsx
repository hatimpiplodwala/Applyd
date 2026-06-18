"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Mail, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth-shell";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <AuthShell title="Reset password" subtitle="We'll send you a link">
      {sent ? (
        <Card className="animate-fade-in">
          <CardContent className="space-y-4 p-6">
            <div className="flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-status-offer-border bg-status-offer-bg text-status-offer-fg">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
            <p className="text-center text-sm">
              If an account exists for <strong>{email}</strong>, a password reset
              link is on its way. Check your inbox (and spam).
            </p>
            <Button variant="secondary" asChild className="w-full">
              <Link href="/login">
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft"
                    aria-hidden
                  />
                  <Input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {error && <FormError message={error} />}

              <Button type="submit" disabled={loading} className="w-full">
                <Send className="h-4 w-4" />
                {loading ? "Sending…" : "Send reset link"}
              </Button>

              <p className="text-center text-sm text-ink-mid">
                Remembered it?{" "}
                <Link
                  href="/login"
                  className="font-medium text-primary hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      )}
    </AuthShell>
  );
}
