"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("forgot");
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
    const tm = setTimeout(() => {
      const param = new URLSearchParams(window.location.search).get("token");
      if (param) setToken(param);
    }, 0);
    return () => clearTimeout(tm);
  }, []);

  const sendLink = () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError(t("errorEmailInvalid"));
      return;
    }
    setError("");
    setSubmitting(true);
    requestPasswordReset(email)
      .then(() => setSent(true))
      .catch(() => setError(t("errorFailed")))
      .finally(() => setSubmitting(false));
  };

  const applyReset = () => {
    if (password.length < 8) {
      setError(t("errorPasswordShort"));
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
        toast(t("updatedToast"));
        router.replace("/login");
      })
      .catch(() => {
        setSubmitting(false);
        setError(t("errorLinkInvalid"));
        setToken(null);
      });
  };

  if (token) {
    return (
      <Card className="p-7">
        <h1 className="text-2xl font-semibold tracking-tight text-navy">
          {t("newTitle")}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">{t("newSub")}</p>
        <div className="mt-6 space-y-4">
          <PasswordField
            required
            label={t("newPassword")}
            placeholder={t("passwordPlaceholder")}
            autoComplete="new-password"
            value={password}
            error={error}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyReset()}
          />
          <Button className="w-full" size="lg" loading={submitting} onClick={applyReset}>
            {t("setNew")}
          </Button>
        </div>
      </Card>
    );
  }

  if (sent) {
    return (
      <Card className="p-7 text-center">
        <MailCheck className="mx-auto size-8 text-success" aria-hidden />
        <h1 className="mt-3 text-xl font-semibold text-navy">{t("inboxTitle")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          {t.rich("inboxBody", {
            email,
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
        </p>
        <Link
          href="/login"
          className="mt-5 inline-block text-sm font-medium text-indigo-900 hover:underline"
        >
          {t("backToLogin")}
        </Link>
      </Card>
    );
  }

  return (
    <Card className="p-7">
      <h1 className="text-2xl font-semibold tracking-tight text-navy">
        {t("title")}
      </h1>
      <p className="mt-1 text-sm text-ink-muted">{t("sub")}</p>
      <div className="mt-6 space-y-4">
        <Field
          required
          label={t("email")}
          type="email"
          placeholder={t("emailPlaceholder")}
          value={email}
          error={error}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendLink()}
        />
        <Button className="w-full" size="lg" loading={submitting} onClick={sendLink}>
          {t("sendLink")}
        </Button>
        <p className="text-center">
          <Link href="/login" className="text-sm font-medium text-indigo-900 hover:underline">
            {t("backToLogin")}
          </Link>
        </p>
      </div>
    </Card>
  );
}
