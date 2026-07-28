"use client";

import { Suspense, useState } from "react";
import { setAuthed } from "@/lib/session";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, ShieldCheck } from "lucide-react";

function LinkContent() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const [linking, setLinking] = useState(false);

  // Mock: token presence decides valid vs expired state.
  if (!token) {
    return (
      <Card className="p-7 text-center">
        <h1 className="text-xl font-semibold text-navy">Link expired</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          This linking link has expired or was already used. Ask Amiva for a
          new one in WhatsApp by saying <strong>&quot;link my account&quot;</strong>.
        </p>
      </Card>
    );
  }

  const confirm = () => {
    setLinking(true);
    // Mock: POST /link/whatsapp/verify {token} → dashboard
    setTimeout(() => { setAuthed(true); router.push("/app/today") }, 800);
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
        Link the WhatsApp number <strong>+234 801 •••• 678</strong> to your
        Amiva account? Everything you do in the chat will appear here, and
        vice versa.
      </p>
      <div className="mt-4 flex items-start gap-2 rounded-[10px] bg-soft p-3 text-xs text-ink-muted">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
        Only link a number that belongs to you. You can unlink it any time in
        Settings.
      </div>
      <Button className="mt-5 w-full" size="lg" loading={linking} onClick={confirm}>
        Link WhatsApp
      </Button>
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
