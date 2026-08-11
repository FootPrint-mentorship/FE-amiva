"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlarmClock,
  CalendarDays,
  CheckSquare,
  Check,
  Clock,
  Video,
  MapPin,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { agendaSummary, fmtTime } from "@/lib/mock";
import { USE_MOCKS } from "@/lib/api/client";
import { timezoneAbbr } from "@/lib/timezones";
import { useStore } from "@/lib/store";
import {
  confirmationsStore,
  eventsStore,
  remindersStore,
  settingsStore,
  tasksStore,
} from "@/lib/stores";
import { resolveConfirmationRemote } from "@/lib/data/assistant";
import { toast } from "@/components/ui/toast";
import { completeReminder, setTaskStatus } from "@/lib/data/collections";
import { cn } from "@/lib/cn";

const priorityTone = {
  urgent: "danger",
  high: "warning",
  medium: "violet",
  low: "neutral",
} as const;

export default function TodayPage() {
  const settings = useStore(settingsStore);
  const allReminders = useStore(remindersStore);
  const allTasks = useStore(tasksStore);
  const allEvents = useStore(eventsStore);
  const confirmations = useStore(confirmationsStore).filter((c) => c.status === "pending");
  const reminders = allReminders.filter((r) => r.status === "scheduled");
  const pad = (n: number) => String(n).padStart(2, "0");
  const d = new Date();
  const todayStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const tasks = allTasks.filter(
    (t) => t.status === "open" && t.due_date !== null && t.due_date <= todayStr
  );
  const [now] = useState(() => Date.now());

  // The summary strip narrates REAL data (mock mode keeps the demo line).
  // A new account reads "your day is clear", never someone else's fake day.
  const sameLocalDay = (iso: string) => {
    const d = new Date(iso);
    const n = new Date();
    return (
      d.getFullYear() === n.getFullYear() &&
      d.getMonth() === n.getMonth() &&
      d.getDate() === n.getDate()
    );
  };
  const eventsToday = allEvents.filter(
    (e) => e.status !== "cancelled" && sameLocalDay(e.start_at)
  ).length;
  const remindersToday = reminders.filter(
    (r) => r.next_fire_at !== null && sameLocalDay(r.next_fire_at)
  ).length;
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
  const summaryParts = [
    eventsToday ? `${plural(eventsToday, "meeting")} on your calendar` : "",
    remindersToday ? `${plural(remindersToday, "reminder")} due` : "",
    tasks.length ? `${plural(tasks.length, "task")} due` : "",
  ].filter(Boolean);
  const daySummary = USE_MOCKS
    ? agendaSummary
    : summaryParts.length
    ? `Today: ${summaryParts.join(" · ")}.`
    : "Your day is clear. Anything you tell Amiva on WhatsApp shows up here too. 🎉";

  const greeting =
    new Date().getHours() < 12
      ? "Good morning"
      : new Date().getHours() < 17
      ? "Good afternoon"
      : "Good evening";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight text-navy">
          {greeting}
          {settings.preferredName && `, ${settings.preferredName}`}
        </h1>
        <p className="text-sm text-ink-muted">
          {new Date().toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}{" "}
          · {settings.timezone}
        </p>
      </div>

      {/* Pending confirmation banner */}
      {confirmations.length > 0 && (
        <Card className="border-warning/40 bg-warning/10 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <ShieldAlert className="size-5 text-warning-ink" aria-hidden />
            <p className="flex-1 text-sm text-navy">
              <span className="font-semibold">1 action needs your approval:</span>{" "}
              {confirmations[0].summary}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  resolveConfirmationRemote(confirmations[0].id, "approved")
                    .then((reply) => toast(reply))
                    .catch(() => toast("That didn't go through — nothing was changed.", { tone: "error" }));
                }}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  resolveConfirmationRemote(confirmations[0].id, "rejected")
                    .then((reply) => toast(reply, { tone: "info" }))
                    .catch(() => toast("That didn't go through — nothing was changed.", { tone: "error" }));
                }}
              >
                Reject
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* AI summary strip */}
      <Card className="border-cyan-500/30 bg-cyan-500/8 p-4">
        <div className="flex gap-3">
          <Sparkles className="mt-0.5 size-5 shrink-0 text-cyan-600" aria-hidden />
          <p className="text-sm leading-relaxed text-navy">{daySummary}</p>
        </div>
      </Card>

      {/* Three columns */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Schedule */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-navy">
              <CalendarDays className="size-4.5 text-violet-500" aria-hidden />
              Schedule
            </h2>
            <Link href="/app/calendar" className="text-xs font-medium text-indigo-900 hover:underline">
              Open calendar
            </Link>
          </div>
          <ol className="space-y-3">
            {allEvents
              .filter((e) => {
                const d = new Date(e.start_at);
                const n = new Date();
                return (
                  e.status !== "cancelled" &&
                  d.getFullYear() === n.getFullYear() &&
                  d.getMonth() === n.getMonth() &&
                  d.getDate() === n.getDate()
                );
              })
              .map((e) => (
              <li
                key={e.id}
                className={cn("flex gap-3", new Date(e.end_at).getTime() < now && "opacity-50")}
              >
                <div className="w-16 shrink-0 pt-0.5 text-right">
                  <p className="text-sm font-medium tabular-nums text-navy">
                    {fmtTime(e.start_at)}
                  </p>
                  <p className="text-[11px] tabular-nums text-ink-muted">
                    {fmtTime(e.end_at)}
                  </p>
                </div>
                <div className="min-w-0 flex-1 rounded-[10px] border border-line bg-soft px-3 py-2">
                  <p className="truncate text-sm font-medium text-navy">
                    {e.title}
                    {new Date(e.end_at).getTime() < now && (
                      <span className="ml-1.5 text-xs font-normal text-ink-muted">ended</span>
                    )}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-muted">
                    {e.conference_url ? (
                      <>
                        <Video className="size-3" aria-hidden /> Google Meet
                      </>
                    ) : e.location ? (
                      <>
                        <MapPin className="size-3" aria-hidden /> {e.location}
                      </>
                    ) : (
                      <>
                        <Clock className="size-3" aria-hidden /> Busy
                      </>
                    )}
                  </p>
                </div>
              </li>
              ))}
          </ol>
        </Card>

        {/* Reminders */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-navy">
              <AlarmClock className="size-4.5 text-violet-500" aria-hidden />
              Reminders
            </h2>
            <Link href="/app/reminders" className="text-xs font-medium text-indigo-900 hover:underline">
              View all
            </Link>
          </div>
          {reminders.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-muted">
              All caught up 🎉
            </p>
          ) : (
            <ul className="space-y-2.5">
              {reminders.slice(0, 4).map((r) => (
                <li
                  key={r.id}
                  className="flex items-center gap-3 rounded-[10px] border border-line px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-navy">{r.title}</p>
                    <p className="text-xs tabular-nums text-ink-muted">
                      {fmtTime(r.due_at)} {timezoneAbbr(settings.timezone)}
                      {r.recurrence_human ? ` · ${r.recurrence_human}` : ""}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      completeReminder(r.id).catch(() =>
                        toast("Couldn't complete that reminder.", { tone: "error" })
                      )
                    }
                  >
                    <Check className="size-4" aria-hidden />
                    Done
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Tasks due */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-navy">
              <CheckSquare className="size-4.5 text-violet-500" aria-hidden />
              Tasks due
            </h2>
            <Link href="/app/tasks" className="text-xs font-medium text-indigo-900 hover:underline">
              View all
            </Link>
          </div>
          <ul className="space-y-2.5">
            {tasks.map((t) => (
              <li key={t.id} className="flex items-center gap-3">
                <button
                  aria-label={`Complete ${t.title}`}
                  onClick={() => {
                    setTaskStatus(t.id, "completed")
                      .then(() =>
                        toast("Task completed.", {
                          action: {
                            label: "Undo",
                            onClick: () => void setTaskStatus(t.id, "open"),
                          },
                        })
                      )
                      .catch(() => toast("Couldn't complete that task.", { tone: "error" }));
                  }}
                  className="flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-md border-2 border-indigo-300 hover:border-indigo-900 hover:bg-indigo-50"
                />
                <span className="min-w-0 flex-1 truncate text-sm text-navy">
                  {t.title}
                </span>
                <Chip tone={priorityTone[t.priority]}>{t.priority}</Chip>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
