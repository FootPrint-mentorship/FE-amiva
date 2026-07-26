"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Repeat,
  MessageCircle,
  Mail,
  Check,
  Clock3,
  MoreHorizontal,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import {
  fmtDay,
  fmtTime,
  reminders as seed,
  user,
  type Reminder,
} from "@/lib/mock";

const tabs = ["Upcoming", "Recurring", "Snoozed", "Completed"] as const;
type Tab = (typeof tabs)[number];

function matches(r: Reminder, tab: Tab) {
  switch (tab) {
    case "Upcoming":
      return r.status === "scheduled";
    case "Recurring":
      return !!r.rrule && r.status !== "completed";
    case "Snoozed":
      return r.status === "snoozed";
    case "Completed":
      return r.status === "completed";
  }
}

export default function RemindersPage() {
  const [tab, setTab] = useState<Tab>("Upcoming");
  const [items, setItems] = useState(seed);

  const visible = useMemo(() => items.filter((r) => matches(r, tab)), [items, tab]);

  const groups = useMemo(() => {
    const map = new Map<string, Reminder[]>();
    for (const r of visible) {
      const key = fmtDay(r.due_at);
      map.set(key, [...(map.get(key) ?? []), r]);
    }
    return [...map.entries()];
  }, [visible]);

  const complete = (id: string) =>
    setItems((cur) =>
      cur.map((r) => (r.id === id ? { ...r, status: "completed" as const } : r))
    );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-navy">
            Reminders
          </h1>
          <p className="text-sm text-ink-muted">
            Delivered on WhatsApp, email or both — exactly when you asked.
          </p>
        </div>
        <Button>
          <Plus className="size-4" aria-hidden />
          New reminder
        </Button>
      </div>

      {/* Tabs */}
      <div role="tablist" className="flex gap-1 rounded-[12px] bg-indigo-50 p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "cursor-pointer rounded-[9px] px-4 py-1.5 text-sm font-medium transition-colors",
              tab === t
                ? "bg-white text-indigo-900 shadow-card"
                : "text-ink-muted hover:text-navy"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Groups */}
      {groups.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <Clock3 className="size-8 text-violet-300" aria-hidden />
          <p className="font-medium text-navy">Nothing here yet</p>
          <p className="max-w-[320px] text-sm text-ink-muted">
            Ask Amiva on WhatsApp — “remind me to call Ada tomorrow at 10” —
            or create one right here.
          </p>
          <Button variant="secondary" size="sm">
            <Plus className="size-4" aria-hidden />
            New reminder
          </Button>
        </Card>
      ) : (
        groups.map(([day, rs]) => (
          <section key={day}>
            <h2 className="mb-2 text-sm font-semibold text-ink-muted">{day}</h2>
            <div className="space-y-2">
              {rs.map((r) => (
                <Card
                  key={r.id}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3",
                    r.status === "completed" && "opacity-60"
                  )}
                >
                  <div className="w-[76px] shrink-0 text-right">
                    <p className="text-sm font-semibold tabular-nums text-navy">
                      {fmtTime(r.due_at)}
                    </p>
                    <p className="text-[11px] text-ink-muted">{user.tz_abbr}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "truncate text-[15px] font-medium text-navy",
                        r.status === "completed" && "line-through"
                      )}
                    >
                      {r.title}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {r.recurrence_human && (
                        <Chip tone="violet">
                          <Repeat className="size-3" aria-hidden />
                          {r.recurrence_human}
                        </Chip>
                      )}
                      {r.status === "snoozed" && (
                        <Chip tone="warning">
                          Snoozed until {fmtDay(r.snoozed_until!)}
                        </Chip>
                      )}
                      {r.notes && (
                        <span className="truncate text-xs text-ink-muted">{r.notes}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-ink-muted" aria-label="Delivery channels">
                    {r.channels.includes("whatsapp") && (
                      <MessageCircle className="size-4 text-success" aria-hidden />
                    )}
                    {r.channels.includes("email") && (
                      <Mail className="size-4 text-violet-500" aria-hidden />
                    )}
                  </div>
                  {r.status !== "completed" && (
                    <div className="flex shrink-0 items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => complete(r.id)}>
                        <Check className="size-4" aria-hidden />
                        Done
                      </Button>
                      <button
                        aria-label="More options"
                        className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-ink-muted hover:bg-indigo-50"
                      >
                        <MoreHorizontal className="size-4" aria-hidden />
                      </button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
