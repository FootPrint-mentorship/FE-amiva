"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { WA_LINK } from "@/lib/site";
import { cn } from "@/lib/cn";

/** The one source of truth for the two primary conversion actions. */
export function CtaPair({
  className,
  invert = false,
}: {
  className?: string;
  /** invert = on dark/indigo backgrounds */
  invert?: boolean;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <a
        href={WA_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "inline-flex min-h-[44px] items-center gap-2 rounded-full px-5 text-[14px] font-semibold transition-all",
          "bg-indigo-900 text-white hover:bg-[#302477] hover:-translate-y-px active:scale-[0.98]",
          invert && "bg-white text-indigo-900 border border-white hover:bg-white/90"
        )}
      >
        <MessageCircle className="size-5" aria-hidden />
        Start on WhatsApp
      </a>
      <Link
        href="/register"
        className={cn(
          "inline-flex min-h-[44px] items-center rounded-full px-5 text-[14px] font-medium transition-all",
          invert
            ? "border border-white/40 text-white hover:bg-white/10"
            : "border border-[#dfe0e8] bg-white text-ink hover:bg-soft"
        )}
      >
        Create free account
      </Link>
    </div>
  );
}
