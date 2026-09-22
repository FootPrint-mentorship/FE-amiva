"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { PasswordField } from "@/components/ui/password-field";
import { GoogleButton, OrDivider } from "@/components/ui/google-button";
import { toast } from "@/components/ui/toast";
import { login as loginAccount } from "@/lib/data/auth";
import { ApiError } from "@/lib/api/client";
import { startGoogleSignIn } from "@/lib/google";
import { useRedirectAuthed } from "@/lib/use-redirect-authed";

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const PHONE_RE = /^\+?\d{7,15}$/;

export default function LoginPage() {
  useRedirectAuthed();
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    const id = identifier.trim().replace(/[\s()-]/g, "");
    const valid = EMAIL_RE.test(id) || PHONE_RE.test(id);
    if (!valid || !password) {
      setError("Enter your email or phone number, and your password.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await loginAccount(id, password);
      router.push("/app/today");
    } catch (err) {
      setSubmitting(false);
      setError(
        err instanceof ApiError && err.status === 401
          ? "That email/phone and password don't match."
          : err instanceof ApiError
          ? err.message
          : "Couldn't reach the server. Try again."
      );
    }
  };

  const google = () => {
    try {
      startGoogleSignIn(); // browser is off to Google
    } catch {
      toast("Google sign-in isn't configured on this server.", { tone: "error" });
    }
  };

  return (
    <Card className="p-7">
      <h1 className="text-2xl font-semibold tracking-tight text-navy">
        Welcome back
      </h1>

      <div className="mt-6">
        <GoogleButton label="Sign in with Google" onClick={google} />
        <OrDivider />
      </div>

      <div className="space-y-4">
        <Field
          required
          label="Email or phone number"
          placeholder="you@example.com or 08012345678"
          autoComplete="username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <div>
          <PasswordField
            required
            label="Password"
            placeholder="••••••••"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          <Link
            href="/forgot-password"
            className="mt-1.5 inline-block text-xs font-medium text-indigo-900 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        {error && (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        )}
        <Button className="w-full" size="lg" loading={submitting} onClick={submit}>
          Log in
        </Button>

        <p className="border-t border-line pt-5 text-center text-sm font-medium text-ink-muted">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-violet-700 underline decoration-cyan-500 decoration-2 underline-offset-4 transition-colors hover:text-indigo-900"
          >
            Sign up
          </Link>
        </p>
      </div>
    </Card>
  );
}
