"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { PasswordField } from "@/components/ui/password-field";
import { PhoneField } from "@/components/ui/phone-field";
import { Select } from "@/components/ui/select";
import { OtpInput } from "@/components/ui/otp-input";
import { GoogleButton, OrDivider } from "@/components/ui/google-button";
import { toast } from "@/components/ui/toast";
import { sendEmailCode as sendCode, verifyEmailCode, register as registerAccount } from "@/lib/data/auth";
import { ApiError } from "@/lib/api/client";
import { startGoogleSignIn } from "@/lib/google";
import { detectTimezone, timezoneOptions } from "@/lib/timezones";
import { cn } from "@/lib/cn";
import { useRedirectAuthed } from "@/lib/use-redirect-authed";

function strength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s; // 0–4
}

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export default function RegisterPage() {
  useRedirectAuthed();
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    cc: "+234",
    phone: "",
    password: "",
    timezone: detectTimezone(),
    consent: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Inline email verification (email is confirmed during registration)
  const [emailStage, setEmailStage] = useState<"idle" | "sent" | "verified">("idle");
  const [emailOtp, setEmailOtp] = useState("");
  const [sending, setSending] = useState(false);

  const pwScore = strength(form.password);
  const pwLabel = ["Too short", "Weak", "Okay", "Good", "Strong"][pwScore];

  const sendEmailCode = async () => {
    if (!EMAIL_RE.test(form.email)) {
      setErrors((e) => ({ ...e, email: "Enter a valid email address first." }));
      return;
    }
    setErrors(({ email: _email, ...rest }) => rest);
    setSending(true);
    try {
      await sendCode(form.email);
      setEmailStage("sent");
      toast(`Code sent to ${form.email}.`);
    } catch (err) {
      setErrors((e) => ({
        ...e,
        email: err instanceof ApiError ? err.message : "Couldn't send the code. Try again.",
      }));
    } finally {
      setSending(false);
    }
  };

  const confirmEmailCode = async (code: string) => {
    setEmailOtp(code);
    if (code.length !== 6) return;
    try {
      await verifyEmailCode(form.email, code);
      setEmailStage("verified");
      toast("Email verified.");
    } catch (err) {
      setEmailOtp("");
      setErrors((e) => ({
        ...e,
        email: err instanceof ApiError ? err.message : "That code didn't match. Try again.",
      }));
    }
  };

  const submit = async () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Your name is required.";
    if (!EMAIL_RE.test(form.email)) errs.email = "Enter a valid email address.";
    else if (emailStage !== "verified") errs.email = "Verify your email to continue.";
    if (form.phone && form.phone.length < 7) errs.phone = "Enter a valid phone number, or leave it empty.";
    if (form.password.length < 8) errs.password = "Use at least 8 characters.";
    if (!form.consent) errs.consent = "Please accept the terms to continue.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSubmitting(true);
    try {
      await registerAccount({
        name: form.name.trim(),
        email: form.email,
        phone: form.phone ? `${form.cc}${form.phone.replace(/^0/, "")}` : undefined,
        password: form.password,
        timezone: form.timezone,
      });
      router.push("/onboarding");
    } catch (err) {
      setSubmitting(false);
      setErrors((e) => ({
        ...e,
        email: err instanceof ApiError ? err.message : "Registration failed. Try again.",
      }));
    }
  };

  const google = () => {
    if (startGoogleSignIn()) return; // real flow: browser is off to Google
    router.push("/complete-profile"); // mock flow
  };

  return (
    <Card className="p-7">
      <h1 className="text-2xl font-semibold tracking-tight text-navy">
        Create your account
      </h1>

      <div className="mt-6">
        <GoogleButton label="Sign up with Google" onClick={google} />
        <OrDivider />
      </div>

      <div className="space-y-4">
        <Field
          required
          label="Full name"
          placeholder="Ada Obi"
          value={form.name}
          error={errors.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        {/* Email + inline verification */}
        <div>
          {/* items-start + a fixed label-height offset: with items-end, an
              error line under the input pushed the button out of alignment. */}
          <div className="flex items-start gap-2">
            <Field
              required
              label="Email"
              type="email"
              placeholder="you@example.com"
              className="min-w-0 flex-1"
              value={form.email}
              error={errors.email}
              disabled={emailStage === "verified"}
              onChange={(e) => {
                setForm({ ...form, email: e.target.value });
                setEmailStage("idle");
                setEmailOtp("");
              }}
            />
            {emailStage !== "verified" && (
              <Button
                variant="secondary"
                className="mt-7 h-11 shrink-0"
                loading={sending}
                onClick={sendEmailCode}
              >
                {emailStage === "sent" ? "Resend code" : "Send code"}
              </Button>
            )}
          </div>
          {emailStage === "sent" && (
            <div className="mt-3 rounded-xl border border-line bg-soft p-3.5">
              <p className="mb-2 text-xs text-ink-muted">
                Enter the 6-digit code we sent to your email.
              </p>
              <OtpInput value={emailOtp} onChange={confirmEmailCode} label="Email code" />
            </div>
          )}
          {emailStage === "verified" && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-success">
              <Check className="size-3.5" aria-hidden /> Email verified
            </p>
          )}
        </div>

        <PhoneField
          cc={form.cc}
          phone={form.phone}
          onCcChange={(cc) => setForm({ ...form, cc })}
          onPhoneChange={(phone) => setForm({ ...form, phone })}
          hint="Optional — the number you use for WhatsApp. You can add it any time in Settings."
          error={errors.phone}
        />

        <div>
          <PasswordField
            required
            label="Password"
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
                      i < pwScore ? (pwScore <= 2 ? "bg-warning" : "bg-success") : "bg-line"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-ink-muted">{pwLabel}</span>
            </div>
          )}
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium text-navy">Timezone</p>
          <Select
            label="Timezone"
            value={form.timezone}
            onChange={(timezone) => setForm({ ...form, timezone })}
            options={timezoneOptions()}
            searchable
          />
          <p className="mt-1 text-xs text-ink-muted">
            Detected automatically. Change it if it&apos;s wrong.
          </p>
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

        <p className="border-t border-line pt-5 text-center text-sm font-medium text-ink-muted">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-violet-700 underline decoration-cyan-500 decoration-2 underline-offset-4 transition-colors hover:text-indigo-900"
          >
            Log in
          </Link>
        </p>
      </div>
    </Card>
  );
}
