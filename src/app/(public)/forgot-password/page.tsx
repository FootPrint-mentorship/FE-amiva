"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { MailCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) return;
    setSubmitting(true);
    // Mock: POST /auth/password/forgot — always claims success (no account enumeration)
    setTimeout(() => {
      setSubmitting(false);
      setSent(true);
    }, 600);
  };

  if (sent) {
    return (
      <Card className="p-7 text-center">
        <MailCheck className="mx-auto size-8 text-success" aria-hidden />
        <h1 className="mt-3 text-xl font-semibold text-navy">Check your inbox</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          If an account exists for <strong>{email}</strong>, we&apos;ve sent a
          link to reset your password.
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
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <Button className="w-full" size="lg" loading={submitting} onClick={submit}>
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
