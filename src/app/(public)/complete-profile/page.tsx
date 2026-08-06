"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { PhoneField } from "@/components/ui/phone-field";
import { Select } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { setAuthed, setProfileComplete } from "@/lib/session";
import { pendingGoogleProfile, clearGoogleProfile } from "@/lib/google";
import { detectTimezone, timezoneOptions } from "@/lib/timezones";
import { settingsStore } from "@/lib/stores";

/**
 * Post-Google-sign-in step: Google supplies name + verified email; this
 * screen collects what it can't — phone (required for WhatsApp), preferred
 * name and timezone.
 */
export default function CompleteProfilePage() {
  const router = useRouter();
  const [google] = useState(() => pendingGoogleProfile());
  const [preferredName, setPreferredName] = useState(
    google?.name.split(" ")[0] ?? ""
  );
  const [cc, setCc] = useState("+234");
  const [phone, setPhone] = useState("");
  const [timezone, setTimezone] = useState(detectTimezone());
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const finish = () => {
    if (phone.length < 7) {
      setError("A phone number is required — Amiva lives on WhatsApp.");
      return;
    }
    setError("");
    setSubmitting(true);
    setTimeout(() => {
      settingsStore.set((c) => ({
        ...c,
        fullName: google?.name ?? c.fullName,
        preferredName: preferredName.trim() || c.preferredName,
        timezone,
        emailVerified: true, // Google emails arrive verified
        phoneVerified: false, // verified during onboarding (skippable)
      }));
      clearGoogleProfile();
      setProfileComplete(true);
      setAuthed(true);
      toast("Welcome to Amiva.");
      router.push("/onboarding");
    }, 600);
  };

  return (
    <Card className="p-7">
      <h1 className="text-2xl font-semibold tracking-tight text-navy">
        Almost there
      </h1>
      <p className="mt-1 text-sm text-ink-muted">
        A couple of details Google doesn&apos;t provide.
      </p>

      {google && (
        <p className="mt-4 flex items-center gap-2 rounded-[10px] bg-success/10 px-3.5 py-2.5 text-sm text-navy">
          <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden />
          Signed in as <strong>{google.email}</strong> — email verified
        </p>
      )}

      <div className="mt-6 space-y-4">
        <PhoneField
          cc={cc}
          phone={phone}
          onCcChange={setCc}
          onPhoneChange={setPhone}
          hint="Required — the number you use for WhatsApp."
          error={error}
        />
        <Field
          label="Preferred name"
          hint="What Amiva calls you"
          value={preferredName}
          onChange={(e) => setPreferredName(e.target.value)}
        />
        <div>
          <p className="mb-1.5 text-sm font-medium text-navy">Timezone</p>
          <Select
            label="Timezone"
            value={timezone}
            onChange={setTimezone}
            options={timezoneOptions()}
            searchable
          />
        </div>
        <Button className="w-full" size="lg" loading={submitting} onClick={finish}>
          Finish setting up
        </Button>
      </div>
    </Card>
  );
}
