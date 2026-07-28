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
import {
  agendaSummary,
  events,
  fmtTime,
  pendingConfirmations,
  reminders as seedReminders,
  tasks as seedTasks,
  user,
} from "@/lib/mock";

const priorityTone = {
  urgent: "danger",
  high: "warning",
  medium: "violet",
  low: "neutral",
} as const;

export default function TodayPage() {
  const [reminders, setReminders] = useState(
    seedReminders.filter((r) => r.status === "scheduled")
  );
  const [tasks, setTasks] = useState(seedTasks);
  const [confirmations, setConfirmations] = useState(pendingConfirmations);

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
          {greeting}, {user.preferred_name}
        </h1>
        <p className="text-sm text-ink-muted">
          {new Date().toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}{" "}
          · {user.timezone}
        </p>
      </div>

      {/* Pending confirmation banner */}
      {confirmations.length > 0 && (
        <Card className="border-warning/40 bg-warning/10 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <ShieldAlert className="size-5 text-[#9a6a1d]" aria-hidden />
            <p className="flex-1 text-sm text-navy">
              <span className="font-semibold">1 action needs your approval:</span>{" "}
              {confirmations[0].summary}
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setConfirmations([])}>
                Approve
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmations([])}>
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
          <p className="text-sm leading-relaxed text-navy">{agendaSummary}</p>
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
            {events.map((e) => (
              <li key={e.id} className="flex gap-3">
                <div className="w-16 shrink-0 pt-0.5 text-right">
                  <p className="text-sm font-medium tabular-nums text-navy">
                    {fmtTime(e.start_at)}
                  </p>
                  <p className="text-[11px] tabular-nums text-ink-muted">
                    {fmtTime(e.end_at)}
                  </p>
                </div>
                <div className="min-w-0 flex-1 rounded-[10px] border border-line bg-soft px-3 py-2">
                  <p className="truncate text-sm font-medium text-navy">{e.title}</p>
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
                      {fmtTime(r.due_at)} {user.tz_abbr}
                      {r.recurrence_human ? ` · ${r.recurrence_human}` : ""}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setReminders((cur) => cur.filter((x) => x.id !== r.id))
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
                  onClick={() =>
                    setTasks((cur) => cur.filter((x) => x.id !== t.id))
                  }
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
