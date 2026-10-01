"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { MessageCircle, ShieldCheck } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { sessionActive } from "@/lib/data/auth";
import { stashPendingLink, verifyWhatsAppLink } from "@/lib/data/linking";

function LinkContent() {
  const router = useRouter();
  const params = useSearchParams();
  const t = useTranslations("link");
  const token = params.get("token");
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState("");

  if (!token) {
    // No token: either a stale/used deep link, or someone navigated here
    // hoping to connect. Offer the web-initiated flow instead of a dead end
    // (the Settings page runs it via ?connect=whatsapp).
    return (
      <Card className="p-7 text-center">
        <h1 className="text-xl font-semibold text-navy">
          {sessionActive() ? t("connectTitle") : t("expiredTitle")}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          {sessionActive() ? t("connectBody") : t("expiredBody")}
        </p>
        {sessionActive() && (
          <Button
            size="lg"
            className="mt-5 w-full"
            onClick={() => router.push("/app/settings?connect=whatsapp")}
          >
            {t("connectButton")}
          </Button>
        )}
      </Card>
    );
  }

  const authed = sessionActive();

  // Not signed in: the token waits in localStorage; the link completes
  // automatically the moment they sign in or finish creating an account.
  if (!authed) {
    stashPendingLink(token);
    return (
      <Card className="p-7">
        <span className="flex size-12 items-center justify-center rounded-[14px] bg-whatsapp-bubble">
          <MessageCircle className="size-6 text-whatsapp" aria-hidden />
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-navy">
          {t("almostTitle")}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          {t("almostBody")}
        </p>
        <div className="mt-5 grid gap-2">
          <Button size="lg" onClick={() => router.push("/login")}>
            {t("signIn")}
          </Button>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => router.push("/register")}
          >
            {t("createAccount")}
          </Button>
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-control bg-soft p-3 text-xs text-ink-muted">
          <ShieldCheck
            className="mt-0.5 size-4 shrink-0 text-success"
            aria-hidden
          />
          {t("onlyContinue")}
        </div>
      </Card>
    );
  }

  const confirm = async () => {
    setLinking(true);
    setError("");
    try {
      await verifyWhatsAppLink(token);
      toast(t("linkedToast"));
      router.push("/app/today");
    } catch (err) {
      setLinking(false);
      setError(
        err instanceof ApiError && err.status === 422
          ? t("errorExpired")
          : t("errorFailed"),
      );
    }
  };

  return (
    <Card className="p-7">
      <span className="flex size-12 items-center justify-center rounded-[14px] bg-whatsapp-bubble">
        <MessageCircle className="size-6 text-whatsapp" aria-hidden />
      </span>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-navy">
        {t("linkTitle")}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
        {t("linkBody")}
      </p>
      <div className="mt-4 flex items-start gap-2 rounded-control bg-soft p-3 text-xs text-ink-muted">
        <ShieldCheck
          className="mt-0.5 size-4 shrink-0 text-success"
          aria-hidden
        />
        {t("onlyLink")}
      </div>
      {error && (
        <p className="mt-3 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      <Button
        className="mt-5 w-full"
        size="lg"
        loading={linking}
        onClick={confirm}
      >
        {t("linkButton")}
      </Button>
      <p className="mt-3 text-center text-xs text-ink-muted">
        {t("wrongAccount")}{" "}
        <Link href="/login" className="underline">
          {t("switchAccount")}
        </Link>
      </p>
    </Card>
  );
}

export default function LinkPage() {
  return (
    <Suspense>
      <LinkContent />
    </Suspense>
  );
}
