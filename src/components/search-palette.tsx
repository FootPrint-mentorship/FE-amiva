"use client";

import { useEffect, useRef, useState } from "react";
import {
  Search,
  Sparkles,
  Mail,
  Brain,
  CalendarDays,
  CheckSquare,
  CornerDownLeft,
} from "lucide-react";
import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/cn";

const sources = ["Memories", "Email", "Calendar", "Tasks"] as const;

type Citation = {
  source_type: "memory" | "email" | "event" | "task";
  title: string;
  snippet: string;
  date: string;
};

type Result = {
  answer: string;
  confidence: "high" | "medium" | "low";
  citations: Citation[];
  not_found: boolean;
};

const citationIcons = {
  memory: Brain,
  email: Mail,
  event: CalendarDays,
  task: CheckSquare,
} as const;

/** Mock of POST /search — canned answers keyed on keywords. */
function mockSearch(q: string): Result {
  const needle = q.toLowerCase();
  if (needle.includes("landlord") || needle.includes("rent")) {
    return {
      answer:
        "Your landlord's account is GTB 0123456789 (Musa Ibrahim). Rent is due on the last Friday of every month — your next reminder is set for Fri 31 Jul, 9:00 AM.",
      confidence: "high",
      citations: [
        {
          source_type: "memory",
          title: "Landlord's account",
          snippet: "GTB 0123456789, Musa Ibrahim. Rent due last Friday…",
          date: "20 Jul",
        },
      ],
      not_found: false,
    };
  }
  if (needle.includes("flight") || needle.includes("nairobi")) {
    return {
      answer:
        "Your Lagos → Nairobi flight is KQ533 on the day after tomorrow, departing 9:15 AM from MMA Terminal 1. You're staying at Sarova Stanley (ref 6HJQZP); James is picking you up.",
      confidence: "high",
      citations: [
        {
          source_type: "event",
          title: "Flight to Nairobi — KQ533",
          snippet: "9:15 AM · MMA Terminal 1",
          date: "This week",
        },
        {
          source_type: "memory",
          title: "Nairobi trip",
          snippet: "Sarova Stanley, booking ref 6HJQZP. Airport pickup…",
          date: "24 Jul",
        },
      ],
      not_found: false,
    };
  }
  if (needle.includes("kemi")) {
    return {
      answer:
        "The proposal for Kemi is due today (task, high priority — 1 of 2 subtasks done). Note: Kemi prefers WhatsApp voice notes for quick updates; formal documents by email.",
      confidence: "medium",
      citations: [
        {
          source_type: "task",
          title: "Send proposal to Kemi",
          snippet: "Due today · high priority",
          date: "Today",
        },
        {
          source_type: "memory",
          title: "Kemi's preferences",
          snippet: "Prefers WhatsApp voice notes over email…",
          date: "23 Jul",
        },
      ],
      not_found: false,
    };
  }
  return {
    answer:
      "I couldn't find that in your connected sources (memories, calendar and tasks were searched). Connecting Gmail would let me search your email too.",
    confidence: "low",
    citations: [],
    not_found: true,
  };
}

/** Mounted only while open — state resets naturally on each open. */
export function SearchPalette({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState("");
  const [enabled, setEnabled] = useState<string[]>(["Memories", "Calendar", "Tasks"]);
  const [result, setResult] = useState<Result | null>(null);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const run = (text?: string) => {
    const query = (text ?? q).trim();
    if (!query || searching) return;
    setSearching(true);
    setResult(null);
    setTimeout(() => {
      setResult(mockSearch(query));
      setSearching(false);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]" role="dialog" aria-label="Search or ask Amiva">
      <div className="absolute inset-0 bg-navy/40" onClick={onClose} />
      <div className="relative w-full max-w-[640px] overflow-hidden rounded-[16px] bg-white shadow-pop">
        {/* Input row */}
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="size-4.5 shrink-0 text-ink-muted" aria-hidden />
          <input
            ref={inputRef}
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === "Return") && run()}
            placeholder="Ask anything — “where is my flight ticket?”"
            aria-label="Search or ask Amiva"
            className="h-14 flex-1 bg-transparent text-[15px] text-navy outline-none placeholder:text-ink-muted"
          />
          <button
            onClick={() => run()}
            disabled={!q.trim() || searching}
            className="flex cursor-pointer items-center gap-1 rounded-lg bg-indigo-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-40"
          >
            <CornerDownLeft className="size-3" aria-hidden /> Search
          </button>
        </div>

        {/* Source toggles */}
        <div className="flex flex-wrap gap-1.5 border-b border-line px-4 py-2.5">
          {sources.map((s) => {
            const on = enabled.includes(s);
            const disabled = s === "Email";
            return (
              <button
                key={s}
                disabled={disabled}
                aria-pressed={on}
                title={disabled ? "Connect Gmail to search email" : undefined}
                onClick={() =>
                  setEnabled((cur) => (on ? cur.filter((x) => x !== s) : [...cur, s]))
                }
                className={cn(
                  "cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  disabled
                    ? "cursor-not-allowed border border-line text-ink-muted/50"
                    : on
                    ? "bg-indigo-900 text-white"
                    : "border border-line text-ink-muted hover:border-indigo-300"
                )}
              >
                {s}
                {disabled && " (connect)"}
              </button>
            );
          })}
        </div>

        {/* Result area */}
        <div className="max-h-[46vh] overflow-y-auto p-4" aria-live="polite">
          {searching ? (
            <div className="flex items-center gap-3 py-6 text-sm text-ink-muted">
              <Sparkles className="size-4 animate-pulse text-cyan-600" aria-hidden />
              Searching your sources…
            </div>
          ) : result ? (
            <div className="space-y-4">
              <div className={cn(
                "rounded-[12px] border p-4",
                result.not_found ? "border-line bg-soft" : "border-cyan-500/30 bg-cyan-500/8"
              )}>
                <div className="flex items-start gap-2.5">
                  <Sparkles className="mt-0.5 size-4 shrink-0 text-cyan-600" aria-hidden />
                  <div>
                    <p className="text-sm leading-relaxed text-navy">{result.answer}</p>
                    {!result.not_found && (
                      <Chip
                        tone={result.confidence === "high" ? "cyan" : result.confidence === "medium" ? "warning" : "neutral"}
                        className="mt-2"
                      >
                        {result.confidence} confidence
                      </Chip>
                    )}
                  </div>
                </div>
              </div>
              {result.citations.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    Sources
                  </p>
                  <div className="space-y-2">
                    {result.citations.map((c, i) => {
                      const Icon = citationIcons[c.source_type];
                      return (
                        <button
                          key={i}
                          className="flex w-full cursor-pointer items-center gap-3 rounded-[10px] border border-line px-3 py-2.5 text-left hover:border-indigo-300"
                        >
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                            <Icon className="size-4 text-indigo-900" aria-hidden />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-navy">{c.title}</span>
                            <span className="block truncate text-xs text-ink-muted">{c.snippet}</span>
                          </span>
                          <span className="shrink-0 text-xs text-ink-muted">{c.date}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-2">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">Try asking</p>
              <div className="flex flex-wrap gap-2">
                {["Where is my flight ticket?", "What's my landlord's account?", "What's due for Kemi?"].map((s) => (
                  <button
                    key={s}
                    onClick={() => { setQ(s); run(s); }}
                    className="cursor-pointer rounded-full border border-line px-3.5 py-1.5 text-[13px] text-ink-muted hover:border-cyan-500 hover:text-navy"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
