"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { PhoneField } from "@/components/ui/phone-field";
import { Select } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { pendingGoogleProfile, clearGoogleProfile } from "@/lib/google";
import { buildE164 } from "@/lib/phone";
import { detectTimezone, timezoneOptions } from "@/lib/timezones";
import { completeProfile } from "@/lib/data/auth";
import { ApiError } from "@/lib/api/client";

/**
 * Post-Google-sign-in step: Google supplies name + verified email; this
 * screen collects what it can't — preferred name, timezone, and (optional,
 * §11.1 as amended 16 Aug 2026) a phone for WhatsApp features.
 */
export default function CompleteProfilePage() {
  const router = useRouter();
  const t = useTranslations("complete");
  const tu = useTranslations("ui");
  const [google] = useState(() => pendingGoogleProfile());
  const [preferredName, setPreferredName] = useState(
    google?.name.split(" ")[0] ?? "",
  );
  const [cc, setCc] = useState("+234");
  const [phone, setPhone] = useState("");
  const [timezone, setTimezone] = useState(detectTimezone());
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const finish = () => {
    const digits = phone.replace(/[\s()-]/g, "");
    if (digits && digits.length < 7) {
      setError(t("errorTooShort"));
      return;
    }
    setError("");
    setSubmitting(true);
    completeProfile({
      phone: digits ? buildE164(cc, digits) : null,
      preferredName: preferredName.trim() || null,
      timezone,
    })
      .then(() => {
        clearGoogleProfile();
        toast(t("welcomeToast"));
        router.push("/onboarding");
      })
      .catch((err) => {
        setSubmitting(false);
        setError(
          err instanceof ApiError && err.code === "CONFLICT"
            ? t("errorConflict")
            : t("errorFailed")
        );
      });
  };

  return (
    <Card className="p-7">
      <h1 className="text-2xl font-semibold tracking-tight text-navy">
        {t("title")}
      </h1>
      <p className="mt-1 text-sm text-ink-muted">{t("sub")}</p>

      {google && (
        <p className="mt-4 flex items-center gap-2 rounded-control bg-success/10 px-3.5 py-2.5 text-sm text-navy">
          <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden />
          <span>
            {t.rich("signedInAs", {
              email: google.email,
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </span>
        </p>
      )}

      <div className="mt-6 space-y-4">
        <PhoneField
          cc={cc}
          phone={phone}
          onCcChange={setCc}
          onPhoneChange={setPhone}
          hint={t("phoneHint")}
          error={error}
        />
        <Field
          label={t("preferredName")}
          hint={t("preferredNameHint")}
          value={preferredName}
          onChange={(e) => setPreferredName(e.target.value)}
        />
        <div>
          <p className="mb-1.5 text-sm font-medium text-navy">{tu("timezone")}</p>
          <Select
            label={tu("timezone")}
            value={timezone}
            onChange={setTimezone}
            options={timezoneOptions()}
            searchable
          />
        </div>
        <Button
          className="w-full"
          size="lg"
          loading={submitting}
          onClick={finish}
        >
          {t("finish")}
        </Button>
      </div>
    </Card>
  );
}
