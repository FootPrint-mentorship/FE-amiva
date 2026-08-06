"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible dialog shell: backdrop click + Escape close, focus moved in on
 * open and restored on close, Tab cycles inside the panel. Every dialog and
 * drawer in the app renders through this.
 */
export function Modal({
  label,
  onClose,
  children,
  position = "center",
  panelClassName,
}: {
  label: string;
  onClose: () => void;
  children: React.ReactNode;
  position?: "center" | "right" | "left" | "top";
  panelClassName?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Keep the latest onClose in a ref so the focus/keyboard effect runs once
  // per mount. Re-running it on every parent render would yank focus back to
  // the panel's first control mid-typing (and a space would "click" it).
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const restoreTo = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    if (panel) {
      const first = panel.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? panel).focus();
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const els = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
      );
      if (els.length === 0) return;
      const first = els[0];
      const last = els[els.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panelRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      restoreTo?.focus?.();
    };
  }, []); // mount-only by design; onClose is read through the ref

  const wrapper = {
    center: "flex items-center justify-center p-4",
    right: "flex justify-end",
    left: "flex justify-start",
    top: "flex items-start justify-center p-4 pt-[12vh]",
  }[position];

  return (
    <div className={cn("fixed inset-0 z-50", wrapper)} role="dialog" aria-modal="true" aria-label={label}>
      <div className="absolute inset-0 bg-scrim/50" onClick={onClose} />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn("relative outline-none", panelClassName)}
      >
        {children}
      </div>
    </div>
  );
}
