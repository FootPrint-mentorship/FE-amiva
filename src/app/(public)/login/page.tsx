"use client";

import { useState } from "react";
import Link from "next/link";
import { setAuthed } from "@/lib/session";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = () => {
    if (!/^\S+@\S+\.\S+$/.test(email) || !password) {
      setError("Enter your email and password.");
      return;
    }
    setError("");
    setSubmitting(true);
    // Mock: POST /auth/login → dashboard
    setTimeout(() => { setAuthed(true); router.push("/app/today") }, 600);
  };

  return (
    <Card className="p-7">
      <h1 className="text-2xl font-semibold tracking-tight text-navy">
        Welcome back
      </h1>
      <p className="mt-1 text-sm text-ink-muted">
        New to Amiva?{" "}
        <Link href="/register" className="font-medium text-indigo-900 hover:underline">
          Create an account
        </Link>
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
        <div>
          <Field
            label="Password"
            type="password"
            placeholder="••••••••"
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
      </div>
    </Card>
  );
}
