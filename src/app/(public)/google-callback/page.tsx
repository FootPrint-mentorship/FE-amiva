"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { googleSignIn } from "@/lib/data/auth";
import { googleRedirectUri } from "@/lib/google";
import { toast } from "@/components/ui/toast";

/** Google bounces here with ?code=… after consent (or ?error=… on cancel).
 * The code is exchanged server-side via POST /auth/google; success lands in
 * the app (or complete-profile for first-time Google accounts). */
export default function GoogleCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) {
      toast(
        params.get("error") === "access_denied"
          ? "Google sign-in was cancelled."
          : "Google sign-in didn't complete. Please try again.",
        { tone: "error" }
      );
      router.replace("/login");
      return;
    }
    googleSignIn(code, googleRedirectUri())
      .then(({ profileComplete }) =>
        router.replace(profileComplete ? "/app/today" : "/complete-profile")
      )
      .catch(() => {
        toast("Google sign-in didn't complete. Please try again.", { tone: "error" });
        router.replace("/login");
      });
  }, [router]);

  // Rendered inside the (public) auth shell (brand panel + centered column).
  return (
    <div className="flex flex-col items-center gap-5 py-16" role="status" aria-live="polite">
      <div className="relative flex size-16 items-center justify-center">
        <span
          aria-hidden
          className="absolute inset-0 animate-spin rounded-full border-2 border-line border-t-indigo-900"
        />
        <Image
          src="/brand/mark.svg"
          alt=""
          width={36}
          height={36}
          className="rounded-[22%]"
        />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-navy">Signing you in with Google…</p>
        <p className="mt-1 text-xs text-ink-muted">This only takes a moment.</p>
      </div>
    </div>
  );
}
