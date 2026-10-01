"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
import { buildE164, isValidE164 } from "@/lib/phone";
import { startGoogleSignIn } from "@/lib/google";
import { detectTimezone, timezoneOptions } from "@/lib/timezones";
import { cn } from "@/lib/cn";
import { useRedirectAuthed } from "@/lib/use-redirect-authed";
import { EVENTS, track } from "@/lib/analytics";

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
  const t = useTranslations("register");
  const tu = useTranslations("ui");
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
  const pwLabel = [
    t("strength0"),
    t("strength1"),
    t("strength2"),
    t("strength3"),
    t("strength4"),
  ][pwScore];

  const sendEmailCode = async () => {
    if (!EMAIL_RE.test(form.email)) {
      setErrors((e) => ({ ...e, email: t("errorEmailFirst") }));
      return;
    }
    setErrors(({ email: _email, ...rest }) => rest);
    setSending(true);
    try {
      await sendCode(form.email);
      setEmailStage("sent");
      toast(t("codeSent", { email: form.email }));
    } catch (err) {
      setErrors((e) => ({
        ...e,
        email: err instanceof ApiError ? err.message : t("errorSendFailed"),
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
      // Clear any earlier "code is invalid" error — it otherwise sits right
      // above the green "Email verified" line and contradicts it.
      setErrors(({ email: _email, ...rest }) => rest);
      toast(t("emailVerifiedToast"));
    } catch (err) {
      setEmailOtp("");
      setErrors((e) => ({
        ...e,
        email: err instanceof ApiError ? err.message : t("errorCodeMismatch"),
      }));
    }
  };

  const submit = async () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = t("errorNameRequired");
    if (!EMAIL_RE.test(form.email)) errs.email = t("errorEmailInvalid");
    else if (emailStage !== "verified") errs.email = t("errorEmailUnverified");
    const phone = form.phone ? buildE164(form.cc, form.phone) : undefined;
    if (phone && !isValidE164(phone)) errs.phone = tu("phoneInvalid");
    if (form.password.length < 8) errs.password = t("errorPasswordShort");
    if (!form.consent) errs.consent = t("errorConsent");
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSubmitting(true);
    try {
      await registerAccount({
        name: form.name.trim(),
        email: form.email,
        phone,
        password: form.password,
        timezone: form.timezone,
      });
      track(EVENTS.signupCompleted, { method: "email" });
      router.push("/onboarding");
    } catch (err) {
      setSubmitting(false);
      // Server 422s carry per-field errors (details.errors[].field) — pin
      // each message to ITS field. A phone regex rejection rendered under
      // the email input (live report, 23 Sep 2026) is exactly the bug this
      // mapping prevents; anything field-less lands as a form-level toast.
      const fieldErrors: Record<string, string> = {};
      if (err instanceof ApiError) {
        const items = (err.details?.errors ?? []) as Array<{ field?: string | null; message?: string }>;
        for (const item of items) {
          if (item.field === "phone") fieldErrors.phone = tu("phoneInvalid");
          else if (item.field && item.message) fieldErrors[item.field] = item.message;
        }
        if (!Object.keys(fieldErrors).length) {
          if (/email/i.test(err.message)) fieldErrors.email = err.message;
          else toast(err.message, { tone: "error" });
        }
      } else {
        toast(t("errorFailed"), { tone: "error" });
      }
      setErrors((e) => ({ ...e, ...fieldErrors }));
    }
  };

  const google = () => {
    try {
      startGoogleSignIn(); // browser is off to Google
    } catch {
      toast(t("googleNotConfigured"), { tone: "error" });
    }
  };

  return (
    <Card className="p-7">
      <h1 className="text-2xl font-semibold tracking-tight text-navy">
        {t("title")}
      </h1>

      <div className="mt-6">
        <GoogleButton label={t("google")} onClick={google} />
        <OrDivider />
      </div>

      <div className="space-y-4">
        <Field
          required
          label={t("name")}
          placeholder={t("namePlaceholder")}
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
              label={t("email")}
              type="email"
              placeholder={t("emailPlaceholder")}
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
                {emailStage === "sent" ? t("resendCode") : t("sendCode")}
              </Button>
            )}
          </div>
          {emailStage === "sent" && (
            <div className="mt-3 rounded-xl border border-line bg-soft p-3.5">
              <p className="mb-2 text-xs text-ink-muted">{t("codeHint")}</p>
              <OtpInput value={emailOtp} onChange={confirmEmailCode} label={t("emailCode")} />
            </div>
          )}
          {emailStage === "verified" && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-success">
              <Check className="size-3.5" aria-hidden /> {t("emailVerified")}
            </p>
          )}
        </div>

        <PhoneField
          cc={form.cc}
          phone={form.phone}
          onCcChange={(cc) => setForm({ ...form, cc })}
          onPhoneChange={(phone) => setForm({ ...form, phone })}
          hint={t("phoneHint")}
          error={errors.phone}
        />

        <div>
          <PasswordField
            required
            label={t("password")}
            placeholder={t("passwordPlaceholder")}
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
          <p className="mb-1.5 text-sm font-medium text-navy">{tu("timezone")}</p>
          <Select
            label={tu("timezone")}
            value={form.timezone}
            onChange={(timezone) => setForm({ ...form, timezone })}
            options={timezoneOptions()}
            searchable
          />
          <p className="mt-1 text-xs text-ink-muted">{t("timezoneHint")}</p>
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
              {t.rich("consent", {
                terms: (chunks) => (
                  <Link href="/terms" className="text-indigo-900 hover:underline" target="_blank">
                    {chunks}
                  </Link>
                ),
                privacy: (chunks) => (
                  <Link href="/privacy-policy" className="text-indigo-900 hover:underline" target="_blank">
                    {chunks}
                  </Link>
                ),
              })}
            </span>
          </label>
          {errors.consent && <p className="mt-1 text-xs text-danger">{errors.consent}</p>}
        </div>

        <Button className="w-full" size="lg" loading={submitting} onClick={submit}>
          {t("submit")}
        </Button>

        <p className="border-t border-line pt-5 text-center text-sm font-medium text-ink-muted">
          {t("haveAccount")}{" "}
          <Link
            href="/login"
            className="font-semibold text-violet-700 underline decoration-cyan-500 decoration-2 underline-offset-4 transition-colors hover:text-indigo-900"
          >
            {t("logIn")}
          </Link>
        </p>
      </div>
    </Card>
  );
}
