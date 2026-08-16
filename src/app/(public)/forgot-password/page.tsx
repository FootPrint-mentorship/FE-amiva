"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { PasswordField } from "@/components/ui/password-field";
import { toast } from "@/components/ui/toast";
import { requestPasswordReset, resetPassword } from "@/lib/data/auth";
import { clearTokens } from "@/lib/api/client";
import { setAuthed } from "@/lib/session";
import { MailCheck } from "lucide-react";

/**
 * Two screens on one route (§11.4): with no token, ask for the email and send
 * the reset link; the emailed link returns here as /forgot-password?token=…
 * and shows the new-password form. A successful reset signs the user out
 * everywhere (the server revokes all session families).
 */
export default function ForgotPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // The token arrives as a query param on the emailed link. Read it after
  // mount (SSR has no location); setState runs in a deferred callback per
  // the react-hooks/set-state-in-effect rule.
  useEffect(() => {
    const t = setTimeout(() => {
      const param = new URLSearchParams(window.location.search).get("token");
      if (param) setToken(param);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const sendLink = () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setError("");
    setSubmitting(true);
    requestPasswordReset(email)
      .then(() => setSent(true))
      .catch(() => setError("That didn't go through. Please try again."))
      .finally(() => setSubmitting(false));
  };

  const applyReset = () => {
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    setError("");
    setSubmitting(true);
    resetPassword(token as string, password)
      .then(() => {
        // The server revoked every session; drop the local one too, or the
        // login page bounces a "signed-in" ghost back into the app.
        clearTokens();
        setAuthed(false);
        toast("Password updated. Log in with your new password.");
        router.replace("/login");
      })
      .catch(() => {
        setSubmitting(false);
        setError("That link is invalid or has expired. Request a fresh one below.");
        setToken(null);
      });
  };

  if (token) {
    return (
      <Card className="p-7">
        <h1 className="text-2xl font-semibold tracking-tight text-navy">
          Choose a new password
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          You&apos;ll be signed out everywhere and can log in with the new one.
        </p>
        <div className="mt-6 space-y-4">
          <PasswordField
            required
            label="New password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            value={password}
            error={error}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyReset()}
          />
          <Button className="w-full" size="lg" loading={submitting} onClick={applyReset}>
            Set new password
          </Button>
        </div>
      </Card>
    );
  }

  if (sent) {
    return (
      <Card className="p-7 text-center">
        <MailCheck className="mx-auto size-8 text-success" aria-hidden />
        <h1 className="mt-3 text-xl font-semibold text-navy">Check your inbox</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          If an account exists for <strong>{email}</strong>, we&apos;ve sent a
          link to reset your password. It works for 30 minutes.
        </p>
        <Link
          href="/login"
          className="mt-5 inline-block text-sm font-medium text-indigo-900 hover:underline"
        >
          ← Back to log in
        </Link>
      </Card>
    );
  }

  return (
    <Card className="p-7">
      <h1 className="text-2xl font-semibold tracking-tight text-navy">
        Reset your password
      </h1>
      <p className="mt-1 text-sm text-ink-muted">
        Enter your account email and we&apos;ll send you a reset link.
      </p>
      <div className="mt-6 space-y-4">
        <Field
          required
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          error={error}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendLink()}
        />
        <Button className="w-full" size="lg" loading={submitting} onClick={sendLink}>
          Send reset link
        </Button>
        <p className="text-center">
          <Link href="/login" className="text-sm font-medium text-indigo-900 hover:underline">
            ← Back to log in
          </Link>
        </p>
      </div>
    </Card>
  );
}
