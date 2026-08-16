"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { user, type Reminder } from "@/lib/mock";
import { useStore } from "@/lib/store";
import { settingsStore } from "@/lib/stores";

const recurrences = ["None", "Daily", "Weekly", "Monthly"] as const;
type Recurrence = (typeof recurrences)[number];
const weekdays = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"] as const;
const weekdayLabels = ["M", "T", "W", "T", "F", "S", "S"];
const channels = [
  { id: "whatsapp", label: "WhatsApp" },
  { id: "email", label: "Email" },
] as const;

function parseRecurrence(rrule: string | null): {
  kind: Recurrence;
  byDays: string[];
} {
  if (!rrule) return { kind: "None", byDays: ["MO"] };
  if (rrule.startsWith("FREQ=DAILY")) return { kind: "Daily", byDays: ["MO"] };
  if (rrule.startsWith("FREQ=WEEKLY")) {
    const m = rrule.match(/BYDAY=([A-Z,]+)/);
    return { kind: "Weekly", byDays: m ? m[1].split(",") : ["MO"] };
  }
  return { kind: "Monthly", byDays: ["MO"] };
}

function toLocalParts(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

/** Builds the reminder the way POST /reminders expects it; RRULE assembly mirrors the server contract.
 *  Pass `initial` to edit — the same fields prefill and Save replaces instead of creating. */
export function ReminderModal({
  onClose,
  onCreate,
  initial,
}: {
  onClose: () => void;
  onCreate: (r: Reminder) => void;
  initial?: Reminder;
}) {
  const today = new Date();
  const init = initial ? parseRecurrence(initial.rrule) : null;
  const initParts = initial ? toLocalParts(initial.due_at) : null;
  const settings = useStore(settingsStore);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [date, setDate] = useState(
    initParts?.date ?? toLocalParts(today.toISOString()).date,
  );
  const [time, setTime] = useState(initParts?.time ?? "09:00");
  const [recurrence, setRecurrence] = useState<Recurrence>(
    init?.kind ?? "None",
  );
  const [byDays, setByDays] = useState<string[]>(init?.byDays ?? ["MO"]);
  // Default only to channels the user has verified — nothing is ever
  // dispatched to an unverified medium (spec §10.2). WhatsApp counts as
  // verified when it is linked (§11.5 as amended): binding runs through the
  // user's own chat, and the backend delivers to the bound wa_id.
  const [chans, setChans] = useState<string[]>(
    initial?.channels ??
      (settings.integrations.whatsapp
        ? ["whatsapp"]
        : settings.emailVerified
          ? ["email"]
          : []),
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState("");
  const channelVerified: Record<string, boolean> = {
    whatsapp: settings.integrations.whatsapp,
    email: settings.emailVerified,
  };

  // If the user didn't touch recurrence while editing, keep the original rrule verbatim
  // (our builder can't reproduce every form, e.g. "last Friday of the month").
  const recurrenceUntouched =
    !!initial &&
    recurrence === init!.kind &&
    byDays.join(",") === init!.byDays.join(",");

  const humanRecurrence = () => {
    if (recurrence === "None") return null;
    if (recurrence === "Daily") return "Every day";
    if (recurrence === "Monthly")
      return `Monthly on day ${new Date(date).getDate()}`;
    const names = {
      MO: "Mon",
      TU: "Tue",
      WE: "Wed",
      TH: "Thu",
      FR: "Fri",
      SA: "Sat",
      SU: "Sun",
    };
    return `Every ${byDays.map((d) => names[d as keyof typeof names]).join(", ")}`;
  };

  const buildRrule = () => {
    if (recurrence === "None") return null;
    if (recurrence === "Daily") return "FREQ=DAILY";
    if (recurrence === "Weekly") return `FREQ=WEEKLY;BYDAY=${byDays.join(",")}`;
    return `FREQ=MONTHLY;BYMONTHDAY=${new Date(date).getDate()}`;
  };

  const save = () => {
    if (!title.trim()) return setError("Give the reminder a title.");
    if (recurrence === "Weekly" && byDays.length === 0)
      return setError("Pick at least one weekday.");
    if (chans.length === 0)
      return setError("Pick at least one delivery channel.");
    const dueAt = new Date(`${date}T${time}:00`);
    if (recurrence === "None" && dueAt.getTime() < Date.now())
      return setError("That time is in the past. Pick a future time.");
    onCreate({
      id: initial?.id ?? `rem_${Date.now()}`,
      title: title.trim(),
      notes: notes.trim() || null,
      due_at: dueAt.toISOString(),
      timezone: user.timezone,
      rrule: recurrenceUntouched ? initial!.rrule : buildRrule(),
      recurrence_human: recurrenceUntouched
        ? initial!.recurrence_human
        : humanRecurrence(),
      channels: chans as Reminder["channels"],
      status: initial?.status ?? "scheduled",
      snoozed_until: initial?.snoozed_until ?? null,
      next_fire_at: dueAt.toISOString(),
      source: initial?.source ?? "web",
    });
    onClose();
  };

  return (
    <Modal
      label={initial ? "Edit reminder" : "New reminder"}
      onClose={onClose}
      panelClassName="w-full max-w-120"
    >
      <Card className="max-h-[90vh] overflow-y-auto p-6">
        <button
          aria-label="Close"
          onClick={onClose}
          className="absolute right-4 top-4 flex size-8 cursor-pointer items-center justify-center rounded-lg text-ink-muted hover:bg-indigo-50"
        >
          <X className="size-4" aria-hidden />
        </button>
        <h2 className="text-lg font-semibold text-navy">
          {initial ? "Edit reminder" : "New reminder"}
        </h2>

        <div className="mt-5 space-y-4">
          <Field
            label="Remind me to…"
            placeholder="Pay NEPA bill"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm font-medium text-navy">
              Date
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-control border border-line bg-white px-3 text-[15px] font-normal"
              />
            </label>
            <label className="text-sm font-medium text-navy">
              Time{" "}
              <span className="font-normal text-ink-muted">
                ({user.tz_abbr})
              </span>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-control border border-line bg-white px-3 text-[15px] font-normal"
              />
            </label>
          </div>

          {/* Recurrence */}
          <div>
            <p className="mb-2 text-sm font-medium text-navy">Repeats</p>
            <div className="flex w-fit gap-1 rounded-xl bg-indigo-50 p-1">
              {recurrences.map((r) => (
                <button
                  key={r}
                  onClick={() => setRecurrence(r)}
                  aria-pressed={recurrence === r}
                  className={cn(
                    "cursor-pointer rounded-[9px] px-3.5 py-1.5 text-sm font-medium transition-colors",
                    recurrence === r
                      ? "bg-white text-indigo-900 shadow-card"
                      : "text-ink-muted hover:text-navy",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
            {recurrence === "Weekly" && (
              <div className="mt-2.5 flex gap-1.5">
                {weekdays.map((d, i) => {
                  const on = byDays.includes(d);
                  return (
                    <button
                      key={d}
                      aria-pressed={on}
                      onClick={() =>
                        setByDays((cur) =>
                          on ? cur.filter((x) => x !== d) : [...cur, d],
                        )
                      }
                      className={cn(
                        "size-9 cursor-pointer rounded-full text-xs font-semibold transition-colors",
                        on
                          ? "bg-indigo-900 text-white"
                          : "border border-line bg-white text-ink-muted",
                      )}
                    >
                      {weekdayLabels[i]}
                    </button>
                  );
                })}
              </div>
            )}
            {recurrence !== "None" && (
              <p className="mt-2 text-xs text-ink-muted">
                {humanRecurrence()} at {time}
              </p>
            )}
          </div>

          {/* Channels */}
          <div>
            <p className="mb-2 text-sm font-medium text-navy">Deliver via</p>
            <div className="flex gap-2">
              {channels.map((c) => {
                const on = chans.includes(c.id);
                const verified = channelVerified[c.id];
                return (
                  <button
                    key={c.id}
                    aria-pressed={on}
                    disabled={!verified}
                    title={
                      verified
                        ? undefined
                        : `Verify your ${c.id === "whatsapp" ? "phone" : "email"} to enable ${c.label}`
                    }
                    onClick={() =>
                      setChans((cur) =>
                        on ? cur.filter((x) => x !== c.id) : [...cur, c.id],
                      )
                    }
                    className={cn(
                      "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                      !verified
                        ? "cursor-not-allowed border-line bg-soft text-ink-muted/60"
                        : on
                          ? "cursor-pointer border-indigo-900 bg-indigo-900 text-white"
                          : "cursor-pointer border-line bg-white text-ink-muted hover:border-indigo-300",
                    )}
                  >
                    {c.label}
                    {!verified && " (verify first)"}
                  </button>
                );
              })}
            </div>
          </div>

          <Field
            label="Notes (optional)"
            placeholder="Anything Amiva should include"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          {error && (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={save}>
              {initial ? "Save changes" : "Create reminder"}
            </Button>
          </div>
        </div>
      </Card>
    </Modal>
  );
}
