"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { cn } from "@/lib/cn";

const countryCodes = ["+234", "+254", "+233", "+27", "+255", "+256"];
const timezones = [
  "Africa/Lagos",
  "Africa/Nairobi",
  "Africa/Accra",
  "Africa/Johannesburg",
  "Africa/Dar_es_Salaam",
  "Africa/Kampala",
  "Europe/London",
];

function strength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s; // 0–4
}

export default function RegisterPage() {
  const router = useRouter();
  const detectedTz = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    []
  );
  const [form, setForm] = useState({
    name: "",
    email: "",
    cc: "+234",
    phone: "",
    password: "",
    timezone: timezones.includes(detectedTz) ? detectedTz : "Africa/Lagos",
    consent: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const pwScore = strength(form.password);
  const pwLabel = ["Too short", "Weak", "Okay", "Good", "Strong"][pwScore];

  const submit = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Your name is required.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = "Enter a valid email address.";
    if (form.phone.replace(/\D/g, "").length < 7) errs.phone = "Enter a valid phone number.";
    if (form.password.length < 8) errs.password = "Use at least 8 characters.";
    if (!form.consent) errs.consent = "Please accept the terms to continue.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSubmitting(true);
    // Mock: POST /auth/register → verification step
    setTimeout(() => router.push("/verify"), 700);
  };

  return (
    <Card className="p-7">
      <h1 className="text-2xl font-semibold tracking-tight text-navy">
        Create your account
      </h1>
      <p className="mt-1 text-sm text-ink-muted">
        Already have one?{" "}
        <Link href="/login" className="font-medium text-indigo-900 hover:underline">
          Log in
        </Link>
      </p>

      <div className="mt-6 space-y-4">
        <Field
          label="Full name"
          placeholder="Ada Obi"
          value={form.name}
          error={errors.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <Field
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          error={errors.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy">
            WhatsApp phone number
          </label>
          <div className="flex gap-2">
            <select
              aria-label="Country code"
              value={form.cc}
              onChange={(e) => setForm({ ...form, cc: e.target.value })}
              className="h-11 rounded-[10px] border border-line bg-white px-2.5 text-[15px] text-navy"
            >
              {countryCodes.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <input
              aria-label="Phone number"
              inputMode="tel"
              placeholder="801 234 5678"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={cn(
                "h-11 flex-1 rounded-[10px] border bg-white px-3.5 text-[15px] text-navy placeholder:text-ink-muted",
                errors.phone ? "border-danger" : "border-line focus:border-indigo-300"
              )}
            />
          </div>
          {errors.phone ? (
            <p className="mt-1 text-xs text-danger">{errors.phone}</p>
          ) : (
            <p className="mt-1 text-xs text-ink-muted">
              The number you use for WhatsApp. Amiva will meet you there.
            </p>
          )}
        </div>
        <div>
          <Field
            label="Password"
            type="password"
            placeholder="At least 8 characters"
            value={form.password}
            error={errors.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          {form.password && (
            <div className="mt-2 flex items-center gap-2" aria-live="polite">
              <div className="flex h-1.5 flex-1 gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={cn(
                      "flex-1 rounded-full",
                      i < pwScore
                        ? pwScore <= 2
                          ? "bg-warning"
                          : "bg-success"
                        : "bg-line"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-ink-muted">{pwLabel}</span>
            </div>
          )}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy">
            Timezone
          </label>
          <select
            aria-label="Timezone"
            value={form.timezone}
            onChange={(e) => setForm({ ...form, timezone: e.target.value })}
            className="h-11 w-full rounded-[10px] border border-line bg-white px-3 text-[15px] text-navy"
          >
            {[...new Set([form.timezone, ...timezones])].map((tz) => (
              <option key={tz}>{tz}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-ink-muted">Detected automatically. Change it if it&apos;s wrong.</p>
        </div>
        <div>
          <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={form.consent}
              onChange={(e) => setForm({ ...form, consent: e.target.checked })}
              className="mt-0.5 size-4 cursor-pointer accent-indigo-900"
            />
            <span>
              I agree to the{" "}
              <Link href="/terms" className="text-indigo-900 hover:underline" target="_blank">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy-policy" className="text-indigo-900 hover:underline" target="_blank">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          {errors.consent && <p className="mt-1 text-xs text-danger">{errors.consent}</p>}
        </div>
        <Button className="w-full" size="lg" loading={submitting} onClick={submit}>
          Create account
        </Button>
      </div>
    </Card>
  );
}
