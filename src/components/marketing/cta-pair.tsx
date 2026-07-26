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
          "inline-flex h-12 items-center gap-2 rounded-[10px] px-6 text-[15px] font-semibold transition-colors",
          "bg-cyan-500 text-navy hover:bg-cyan-400"
        )}
      >
        <MessageCircle className="size-5" aria-hidden />
        Start on WhatsApp
      </a>
      <Link
        href="/register"
        className={cn(
          "inline-flex h-12 items-center rounded-[10px] px-6 text-[15px] font-medium transition-colors",
          invert
            ? "border border-white/40 text-white hover:bg-white/10"
            : "border border-indigo-300 text-indigo-900 hover:bg-indigo-50"
        )}
      >
        Create free account
      </Link>
    </div>
  );
}
