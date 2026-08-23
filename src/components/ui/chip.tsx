import { cn } from "@/lib/cn";
import { HTMLAttributes } from "react";

type Tone = "indigo" | "violet" | "cyan" | "success" | "warning" | "danger" | "neutral";

const tones: Record<Tone, string> = {
  indigo: "bg-indigo-50 text-indigo-900",
  violet: "bg-violet-100 text-violet-700",
  cyan: "bg-cyan-500/15 text-cyan-600",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning-ink",
  danger: "bg-danger/10 text-danger",
  neutral: "bg-soft text-ink-muted",
};

export function Chip({
  tone = "neutral",
  wrap = false,
  className,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone; wrap?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        // Long human text (e.g. a recurrence description) must wrap instead of
        // widening the page on small screens — cn() has no tailwind-merge, so
        // the variant lives here rather than in a caller's className override.
        wrap ? "min-w-0 max-w-full whitespace-normal" : "whitespace-nowrap",
        tones[tone],
        className
      )}
      {...rest}
    />
  );
}
