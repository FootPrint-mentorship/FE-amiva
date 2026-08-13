"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { MessageCircle, ShieldCheck } from "lucide-react";
import { USE_MOCKS, ApiError } from "@/lib/api/client";
import { setAuthed } from "@/lib/session";
import { sessionActive } from "@/lib/data/auth";
import { stashPendingLink, verifyWhatsAppLink } from "@/lib/data/linking";

function LinkContent() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState("");

  if (!token) {
    return (
      <Card className="p-7 text-center">
        <h1 className="text-xl font-semibold text-navy">Link expired</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          This linking link has expired or was already used. Message Amiva
          again on WhatsApp and she&apos;ll send you a fresh one.
        </p>
      </Card>
    );
  }

  const authed = USE_MOCKS ? false : sessionActive();

  // Not signed in: the token waits in localStorage; the link completes
  // automatically the moment they sign in or finish creating an account.
  if (!authed && !USE_MOCKS) {
    stashPendingLink(token);
    return (
      <Card className="p-7">
        <span className="flex size-12 items-center justify-center rounded-[14px] bg-[#d9fdd3]">
          <MessageCircle className="size-6 text-[#075e54]" aria-hidden />
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-navy">
          Almost there
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Sign in or create your Amiva account and the WhatsApp number
          you just messaged from will be connected automatically.
        </p>
        <div className="mt-5 grid gap-2">
          <Button size="lg" onClick={() => router.push("/login")}>
            Sign in
          </Button>
          <Button size="lg" variant="secondary" onClick={() => router.push("/register")}>
            Create an account
          </Button>
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-control bg-soft p-3 text-xs text-ink-muted">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
          Only continue if you just messaged Amiva yourself. You can unlink
          the number any time in Settings.
        </div>
      </Card>
    );
  }

  const confirm = async () => {
    setLinking(true);
    setError("");
    if (USE_MOCKS) {
      // Self-contained demo keeps the old happy path.
      setTimeout(() => {
        setAuthed(true);
        router.push("/app/today");
      }, 800);
      return;
    }
    try {
      await verifyWhatsAppLink(token);
      toast("WhatsApp linked — anything you tell Amiva shows up here too.");
      router.push("/app/today");
    } catch (err) {
      setLinking(false);
      setError(
        err instanceof ApiError && err.status === 422
          ? "This link has expired or was already used — message Amiva on WhatsApp for a fresh one."
          : "Couldn't link right now. Please try again."
      );
    }
  };

  return (
    <Card className="p-7">
      <span className="flex size-12 items-center justify-center rounded-[14px] bg-[#d9fdd3]">
        <MessageCircle className="size-6 text-[#075e54]" aria-hidden />
      </span>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-navy">
        Link your WhatsApp
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
        Connect the WhatsApp number you just messaged Amiva from to this
        account? Everything you do in the chat will appear here, and vice
        versa.
      </p>
      <div className="mt-4 flex items-start gap-2 rounded-[10px] bg-soft p-3 text-xs text-ink-muted">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
        Only link a number that belongs to you. You can unlink it any time in
        Settings.
      </div>
      {error && (
        <p className="mt-3 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      <Button className="mt-5 w-full" size="lg" loading={linking} onClick={confirm}>
        Link WhatsApp
      </Button>
      <p className="mt-3 text-center text-xs text-ink-muted">
        Wrong account?{" "}
        <Link href="/login" className="underline">
          Switch account
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
