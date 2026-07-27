"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

  const submit = () => {
    setSubmitting(true);
    // Mock: POST /auth/verify-email + /auth/verify-phone → onboarding
    setTimeout(() => router.push("/onboarding"), 700);
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
          <button className="mt-2 cursor-pointer text-xs font-medium text-indigo-900 hover:underline">
            Resend email code
          </button>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-navy">Phone code</p>
            {phoneOk && <Check className="size-4 text-success" aria-label="Phone code complete" />}
          </div>
          <OtpInput value={phoneCode} onChange={setPhoneCode} label="Phone code" />
          <button className="mt-2 cursor-pointer text-xs font-medium text-indigo-900 hover:underline">
            Resend phone code
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
