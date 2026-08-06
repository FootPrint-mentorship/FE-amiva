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
import { ReminderModal } from "@/components/domain/reminder-modal";
import { cn } from "@/lib/cn";
import { fmtDay, fmtTime, user, type Reminder } from "@/lib/mock";
import { useStore } from "@/lib/store";
import { remindersStore } from "@/lib/stores";
import { toast } from "@/components/ui/toast";
import {
  completeReminder,
  deleteReminder,
  saveReminder,
  skipReminder,
  snoozeReminder,
  toggleReminderPause,
} from "@/lib/data/collections";

const tabs = ["Upcoming", "Recurring", "Snoozed", "Completed"] as const;
type Tab = (typeof tabs)[number];

function matches(r: Reminder, tab: Tab) {
  switch (tab) {
    case "Upcoming":
      return r.status === "scheduled" || r.status === "paused";
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
  const items = useStore(remindersStore);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Reminder | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const fail = (err: unknown) =>
    toast(err instanceof Error ? err.message : "That didn't go through. Try again.", {
      tone: "error",
    });

  const upsert = (r: Reminder, isNew: boolean) =>
    saveReminder(r, isNew).catch(fail);

  const togglePause = (r: Reminder) =>
    toggleReminderPause(r.id, r.status !== "paused").catch(fail);

  const remove = (id: string) =>
    deleteReminder(id)
      .then(() => toast("Reminder deleted.", { tone: "info" }))
      .catch(fail);

  const snooze = (id: string, until: Date, label: string) =>
    snoozeReminder(id, until)
      .then(() => toast(`Snoozed ${label}.`))
      .catch(fail);

  const skipNext = (r: Reminder) => {
    const next = new Date(r.due_at);
    if (r.rrule?.startsWith("FREQ=DAILY")) next.setDate(next.getDate() + 1);
    else if (r.rrule?.startsWith("FREQ=WEEKLY")) next.setDate(next.getDate() + 7);
    else next.setMonth(next.getMonth() + 1);
    skipReminder(r.id, next)
      .then((saved) => {
        const at = saved?.next_fire_at ?? next.toISOString();
        toast(`Skipped. Next: ${fmtDay(at)} at ${fmtTime(at)}.`);
      })
      .catch(fail);
  };

  const visible = useMemo(() => items.filter((r) => matches(r, tab)), [items, tab]);

  const groups = useMemo(() => {
    const map = new Map<string, Reminder[]>();
    for (const r of visible) {
      const key = fmtDay(r.due_at);
      map.set(key, [...(map.get(key) ?? []), r]);
    }
    return [...map.entries()];
  }, [visible]);

  const complete = (id: string) => completeReminder(id).catch(fail);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-navy">
            Reminders
          </h1>
          <p className="text-sm text-ink-muted">
            Delivered on WhatsApp, email or both, exactly when you asked.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" aria-hidden />
          New reminder
        </Button>
      </div>

      {creating && (
        <ReminderModal onClose={() => setCreating(false)} onCreate={(r) => upsert(r, true)} />
      )}
      {editing && (
        <ReminderModal
          initial={editing}
          onClose={() => setEditing(null)}
          onCreate={(r) => upsert(r, false)}
        />
      )}

      {/* Tabs */}
      <div role="tablist" className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl bg-indigo-50 p-1">
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
          <p className="max-w-80 text-sm text-ink-muted">
            Say “remind me to call Ada tomorrow at 10” to Amiva on WhatsApp,
            or create one right here.
          </p>
          <Button variant="secondary" size="sm" onClick={() => setCreating(true)}>
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
                  <div className="w-19 shrink-0 text-right">
                    <p className="text-sm font-semibold tabular-nums text-navy">
                      {fmtTime(r.due_at)}
                    </p>
                    <p className="text-[11px] text-ink-muted">{user.tz_abbr}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "line-clamp-2 text-[15px] font-medium text-navy",
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
                      {r.status === "paused" && <Chip tone="neutral">Paused</Chip>}
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
                    <div className="relative flex shrink-0 items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => complete(r.id)}>
                        <Check className="size-4" aria-hidden />
                        Done
                      </Button>
                      <button
                        aria-label="More options"
                        aria-expanded={menuFor === r.id}
                        onClick={() => setMenuFor(menuFor === r.id ? null : r.id)}
                        className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-ink-muted hover:bg-indigo-50"
                      >
                        <MoreHorizontal className="size-4" aria-hidden />
                      </button>
                      {menuFor === r.id && (
                        <>
                          <div
                            className="fixed inset-0 z-30"
                            onClick={() => setMenuFor(null)}
                          />
                          <div
                            role="menu"
                            className="absolute right-0 top-9 z-40 w-52 overflow-hidden rounded-xl border border-line bg-white py-1 shadow-pop"
                          >
                            <button
                              role="menuitem"
                              className="block w-full cursor-pointer px-3.5 py-2 text-left text-sm text-navy hover:bg-indigo-50"
                              onClick={() => { setMenuFor(null); setEditing(r); }}
                            >
                              Edit
                            </button>
                            <button
                              role="menuitem"
                              className="block w-full cursor-pointer px-3.5 py-2 text-left text-sm text-navy hover:bg-indigo-50"
                              onClick={() => {
                                setMenuFor(null);
                                snooze(r.id, new Date(Date.now() + 3600000), "for 1 hour");
                              }}
                            >
                              Snooze 1 hour
                            </button>
                            <button
                              role="menuitem"
                              className="block w-full cursor-pointer px-3.5 py-2 text-left text-sm text-navy hover:bg-indigo-50"
                              onClick={() => {
                                setMenuFor(null);
                                const tmrw = new Date();
                                tmrw.setDate(tmrw.getDate() + 1);
                                tmrw.setHours(9, 0, 0, 0);
                                snooze(r.id, tmrw, "until tomorrow 9:00 AM");
                              }}
                            >
                              Snooze until tomorrow
                            </button>
                            {r.rrule && (
                              <button
                                role="menuitem"
                                className="block w-full cursor-pointer px-3.5 py-2 text-left text-sm text-navy hover:bg-indigo-50"
                                onClick={() => { setMenuFor(null); skipNext(r); }}
                              >
                                Skip next
                              </button>
                            )}
                            <button
                              role="menuitem"
                              className="block w-full cursor-pointer px-3.5 py-2 text-left text-sm text-navy hover:bg-indigo-50"
                              onClick={() => { setMenuFor(null); togglePause(r); }}
                            >
                              {r.status === "paused" ? "Resume" : "Pause"}
                            </button>
                            <button
                              role="menuitem"
                              className="block w-full cursor-pointer px-3.5 py-2 text-left text-sm text-danger hover:bg-danger/5"
                              onClick={() => { setMenuFor(null); remove(r.id); }}
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
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
