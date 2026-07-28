"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { setAuthed } from "@/lib/session";
import { toast } from "@/components/ui/toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OtpInput } from "@/components/ui/otp-input";
import { Check } from "lucide-react";

export default function VerifyPage() {
  const router = useRouter();
  const [emailCode, setEmailCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const emailOk = emailCode.length === 6;
  const phoneOk = phoneCode.length === 6;
  const [cooldown, setCooldown] = useState<Record<string, number>>({});

  useEffect(() => {
    const t = setInterval(
      () =>
        setCooldown((c) =>
          Object.fromEntries(Object.entries(c).map(([k, v]) => [k, Math.max(0, v - 1)]))
        ),
      1000
    );
    return () => clearInterval(t);
  }, []);

  const resend = (kind: "email" | "phone") => {
    setCooldown((c) => ({ ...c, [kind]: 60 }));
    toast(`New code sent to your ${kind}.`);
  };

  const submit = () => {
    setSubmitting(true);
    // Mock: POST /auth/verify-email + /auth/verify-phone → onboarding
    setTimeout(() => { setAuthed(true); router.push("/onboarding"); }, 700);
  };

  return (
    <Card className="p-7">
      <h1 className="text-2xl font-semibold tracking-tight text-navy">
        Verify your details
      </h1>
      <p className="mt-1 text-sm text-ink-muted">
        We sent a 6-digit code to your email and a code to your phone.
      </p>

      <div className="mt-6 space-y-6">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-navy">Email code</p>
            {emailOk && <Check className="size-4 text-success" aria-label="Email code complete" />}
          </div>
          <OtpInput value={emailCode} onChange={setEmailCode} label="Email code" />
          <button
            disabled={(cooldown.email ?? 0) > 0}
            onClick={() => resend("email")}
            className="mt-2 cursor-pointer text-xs font-medium text-indigo-900 hover:underline disabled:cursor-default disabled:text-ink-muted disabled:no-underline"
          >
            {(cooldown.email ?? 0) > 0 ? `Resend in ${cooldown.email}s` : "Resend email code"}
          </button>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-navy">Phone code</p>
            {phoneOk && <Check className="size-4 text-success" aria-label="Phone code complete" />}
          </div>
          <OtpInput value={phoneCode} onChange={setPhoneCode} label="Phone code" />
          <button
            disabled={(cooldown.phone ?? 0) > 0}
            onClick={() => resend("phone")}
            className="mt-2 cursor-pointer text-xs font-medium text-indigo-900 hover:underline disabled:cursor-default disabled:text-ink-muted disabled:no-underline"
          >
            {(cooldown.phone ?? 0) > 0 ? `Resend in ${cooldown.phone}s` : "Resend phone code"}
          </button>
        </div>
        <Button
          className="w-full"
          size="lg"
          disabled={!emailOk || !phoneOk}
          loading={submitting}
          onClick={submit}
        >
          Verify and continue
        </Button>
      </div>
    </Card>
  );
}
