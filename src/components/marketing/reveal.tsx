"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/** Scroll-reveal wrapper for marketing sections: children stay invisible
 * until they enter the viewport, then play the rise (or scale) animation
 * once. Progressive enhancement only: hiding is gated on `html.js`, so
 * crawlers and no-JS readers (incl. Google's OAuth brand review) see the
 * full page, and a fallback timer reveals never-intersected sections after
 * 3s so full-page screenshots aren't blank. Respects prefers-reduced-motion
 * (content appears immediately). `delay` staggers siblings (milliseconds). */
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
      // Deferred so the effect body never calls setState synchronously
      // (react-hooks/set-state-in-effect); fires on the next tick, so
      // content is hidden no longer than the observer path would take.
      const id = setTimeout(() => setShown(true), 0);
      return () => clearTimeout(id);
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          clearTimeout(fallback);
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    // Fallback: reveal offscreen sections shortly after load even if they
    // never intersect. Full-page screenshotters (Google OAuth brand review,
    // link unfurlers) capture beyond the viewport without firing observers —
    // without this the page looks blank below the fold. Only offscreen
    // content is affected, so users see no visual change; sections reached
    // after the timer simply appear without the entrance animation.
    const fallback = setTimeout(() => {
      setShown(true);
      io.disconnect();
    }, 3000);
    return () => {
      io.disconnect();
      clearTimeout(fallback);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        shown
          ? variant === "scale"
            ? "animate-scale-in"
            : "animate-rise"
          : // Hidden via a class that only applies under html.js (set by the
            // inline script in the root layout) — never inline opacity, so
            // crawlers and no-JS readers always see the full page.
            "reveal-hidden",
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
