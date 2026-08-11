"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/cn";

const faqs = [
  {
    q: "Do I need to install an app?",
    a: "No. Amiva works inside WhatsApp, the app you already use every day. The web dashboard is optional, for when you want a bigger view of your reminders, calendar and memories.",
  },
  {
    q: "What can I ask Amiva to do?",
    a: "Set one-time or recurring reminders, create and reschedule calendar events, manage tasks and shopping lists, save things to memory (\"remember my landlord's account...\"), search everything you've saved, and summarise your email.",
  },
  {
    q: "Is my data private?",
    a: "Yes. Your data is encrypted, never used to train AI models, and you can see, export or permanently delete everything from the privacy centre. Important actions, like sending an email, always require your explicit approval first.",
  },
  {
    q: "How much does it cost?",
    a: "Amiva has a free plan to get organised, and a Pro plan for unlimited use with email features. Pricing is in your local currency. See the pricing section for details.",
  },
];

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
            <p className="pb-6 text-sm leading-[1.7] text-ink-muted">{f.a}</p>
          )}
        </div>
      ))}
    </div>
  );
}
