import Image from "next/image";
import { cn } from "@/lib/cn";

/** Brand lockup using the official horizontal logo SVG. */
export function Logo({
  variant = "dark",
  size = 32,
  className,
}: {
  /** dark = on light bg (default) · light = on dark/indigo bg */
  variant?: "dark" | "light";
  size?: number;
  className?: string;
}) {
  // The horizontal logo is 360×360 viewBox but wide — treat height as 'size',
  // width proportional at ~4.4× (360w mark + wordmark, real ratio is wider).
  const h = size;
  const w = Math.round(h * 4.4);

  return (
    <span className={cn("inline-flex items-center", className)}>
      <Image
        src="/brand/logo-horizontal.svg"
        alt="Amiva"
        width={w}
        height={h}
        priority
        style={
          variant === "light"
            ? { filter: "brightness(0) invert(1)" }
            : undefined
        }
      />
    </span>
  );
}
