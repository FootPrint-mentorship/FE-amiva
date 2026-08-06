import { cn } from "@/lib/cn";
import { HTMLAttributes, Ref } from "react";

export function Card({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { ref?: Ref<HTMLDivElement> }) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-white shadow-card border border-line",
        className
      )}
      {...rest}
    />
  );
}
