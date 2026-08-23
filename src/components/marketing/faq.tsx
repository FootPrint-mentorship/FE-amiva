"use client";

import { faqs } from "./faq-data";

import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/cn";


export function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div>
      {faqs.map((f, i) => (
        <div
          key={f.q}
          className={cn(
            "border-t border-line",
            i === faqs.length - 1 && "border-b"
          )}
        >
          <button
            className="flex w-full cursor-pointer items-center justify-between gap-4 py-6 text-left"
            aria-expanded={open === i}
            aria-controls={`faq-panel-${i}`}
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span className="text-[15px] font-semibold text-navy">{f.q}</span>
            <Plus
              className={cn(
                "size-5 shrink-0 text-ink-muted transition-transform duration-200",
                open === i && "rotate-45"
              )}
              aria-hidden
            />
          </button>
          {open === i && (
            <p id={`faq-panel-${i}`} className="pb-6 text-sm leading-[1.7] text-ink-muted">
              {f.a}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
