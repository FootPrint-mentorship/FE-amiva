import Image from "next/image";
import { cn } from "@/lib/cn";

/** Brand lockup: square app-icon mark + Inter wordmark. */
export function Logo({
  variant = "dark",
  size = 32,
  className,
}: {
  /** dark = navy wordmark on light bg · light = white wordmark on dark bg */
  variant?: "dark" | "light";
  size?: number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Image
        src="/brand/mark.svg"
        alt=""
        width={size}
        height={size}
        priority
        className="rounded-[22%]"
      />
      <span
        className={cn(
          "font-semibold tracking-tight",
          variant === "dark" ? "text-navy" : "text-white"
        )}
        style={{ fontSize: size * 0.66 }}
      >
        Amiva
      </span>
    </span>
  );
}
