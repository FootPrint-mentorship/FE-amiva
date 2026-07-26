"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

const faqs = [
  {
    q: "Do I need to install an app?",
    a: "No. Amiva works inside WhatsApp — the app you already use every day. The web dashboard is optional, for when you want a bigger view of your reminders, calendar and memories.",
  },
  {
    q: "What can I ask Amiva to do?",
    a: "Set one-time or recurring reminders, create and reschedule calendar events, manage tasks and shopping lists, save things to memory (“remember my landlord's account…”), search everything you've saved, and summarise your email.",
  },
  {
    q: "Is my data private?",
    a: "Yes. Your data is encrypted, never used to train AI models, and you can see, export or permanently delete everything from the privacy centre. Important actions — like sending an email — always require your explicit approval first.",
  },
  {
    q: "How much does it cost?",
    a: "Amiva has a free plan to get organised, and a Pro plan for unlimited use with email features. Pricing is in your local currency — see the pricing section for details.",
  },
];

export function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="mx-auto max-w-[720px] divide-y divide-line rounded-[16px] border border-line bg-white shadow-card">
      {faqs.map((f, i) => (
        <div key={f.q}>
          <button
            className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left"
            aria-expanded={open === i}
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span className="text-[15px] font-medium text-navy">{f.q}</span>
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-ink-muted transition-transform",
                open === i && "rotate-180"
              )}
              aria-hidden
            />
          </button>
          {open === i && (
            <p className="px-5 pb-5 text-sm leading-relaxed text-ink-muted">
              {f.a}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
