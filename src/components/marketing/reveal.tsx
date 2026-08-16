"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/** Scroll-reveal wrapper for marketing sections: children stay invisible
 * until they enter the viewport, then play the rise (or scale) animation
 * once. Respects prefers-reduced-motion (content appears immediately) and
 * never hides content from crawlers or non-JS readers longer than the
 * observer takes to fire. `delay` staggers siblings (milliseconds). */
export function Reveal({
  children,
  className,
  delay = 0,
  variant = "rise",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  variant?: "rise" | "scale";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // No observer/matchMedia (jsdom, very old browsers) or reduced motion:
    // show immediately — content must never stay hidden.
    if (
      typeof window.matchMedia !== "function" ||
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        shown && (variant === "scale" ? "animate-scale-in" : "animate-rise"),
        className
      )}
      style={{ animationDelay: `${delay}ms`, ...(shown ? {} : { opacity: 0 }) }}
    >
      {children}
    </div>
  );
}
