"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  MapPin,
  Video,
  Users,
  X,
  CalendarDays,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import {
  cancelEvent as cancelEventApi,
  saveEvent,
} from "@/lib/data/collections";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/store";
import { eventsStore, settingsStore } from "@/lib/stores";
import { fmtTime, fmtDay, type CalendarEvent } from "@/lib/mock";
import { timezoneAbbr } from "@/lib/timezones";
import { newId } from "@/lib/id";

const views = ["Day", "Week", "Agenda"] as const;
type View = (typeof views)[number];

const HOUR_START = 7;
const HOUR_END = 21;
const PX_PER_HOUR = 52;

function dayKey(d: Date) {
  // Local calendar date, NOT toISOString(): UTC keys shift the whole grid
  // one day for any timezone ahead of UTC (PRD: zero silent tz errors).
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

function EventBlock({
  event,
  onClick,
}: {
  event: CalendarEvent;
  onClick: () => void;
}) {
  const start = new Date(event.start_at);
  const end = new Date(event.end_at);
  const top =
    (start.getHours() + start.getMinutes() / 60 - HOUR_START) * PX_PER_HOUR;
  const height = Math.max(
    ((end.getTime() - start.getTime()) / 3_600_000) * PX_PER_HOUR,
    26,
  );
  return (
    <button
      onClick={onClick}
      className={cn(
        "absolute inset-x-1 cursor-pointer overflow-hidden rounded-lg border px-2 py-1 text-left transition-opacity hover:opacity-90",
        event.status === "tentative"
          ? "border-dashed border-violet-500 bg-violet-100 text-violet-700"
          : "border-indigo-700 bg-indigo-900 text-white",
      )}
      style={{ top, height }}
    >
      <p className="truncate text-xs font-semibold leading-tight">
        {event.title}
      </p>
      {height > 40 && (
        <p
          className={cn(
            "truncate text-[11px]",
            event.status === "tentative"
              ? "text-violet-700/80"
              : "text-white/70",
          )}
        >
          {fmtTime(event.start_at)}–{fmtTime(event.end_at)}
        </p>
      )}
    </button>
  );
}

export default function CalendarPage() {
  const [view, setView] = useState<View>("Week");
  const [anchor, setAnchor] = useState(() => new Date());
  const [openEvent, setOpenEvent] = useState<CalendarEvent | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const items = useStore(eventsStore);
  const settings = useStore(settingsStore);
  const tzAbbr = timezoneAbbr(settings.timezone);
  const gridRef = useRef<HTMLDivElement>(null);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(() => ({
    title: "",
    date: dayKey(new Date()),
    start: "10:00",
    end: "10:30",
    location: "",
    meet: true,
    attendees: "",
  }));
  const [draftError, setDraftError] = useState("");

  const startEdit = (e: CalendarEvent) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const s = new Date(e.start_at);
    const en = new Date(e.end_at);
    setDraft({
      title: e.title,
      date: `${s.getFullYear()}-${pad(s.getMonth() + 1)}-${pad(s.getDate())}`,
      start: `${pad(s.getHours())}:${pad(s.getMinutes())}`,
      end: `${pad(en.getHours())}:${pad(en.getMinutes())}`,
      location: e.location ?? "",
      meet: !!e.conference_url,
      attendees: e.attendees.map((a) => a.email).join(", "),
    });
    setEditingId(e.id);
    setOpenEvent(null);
    setCreating(true);
  };

  const createEvent = () => {
    if (!draft.title.trim()) return setDraftError("Give the event a title.");
    if (draft.end <= draft.start)
      return setDraftError("End time must be after start time.");
    const startAt = new Date(`${draft.date}T${draft.start}:00`);
    const endAt = new Date(`${draft.date}T${draft.end}:00`);
    const clash = items.find(
      (e) =>
        e.id !== editingId &&
        e.status !== "cancelled" &&
        new Date(e.start_at) < endAt &&
        new Date(e.end_at) > startAt,
    );
    if (clash && !draftError.startsWith("Heads up")) {
      return setDraftError(
        `Heads up: this overlaps “${clash.title}”. Click again to book anyway.`,
      );
    }
    const built: CalendarEvent = {
      id: editingId ?? newId("evt"),
      title: draft.title.trim(),
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      all_day: false,
      location: draft.location.trim() || null,
      conference_url: draft.meet ? "https://meet.google.com/new" : null,
      attendees: draft.attendees
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean)
        .map((email) => ({
          email,
          name: email.split("@")[0],
          response_status: "needsAction",
        })),
      status: "confirmed",
    };
    saveEvent(built, !editingId).catch(fail);
    setCreating(false);
    setEditingId(null);
    setDraftError("");
    setDraft({ ...draft, title: "", location: "", attendees: "" });
  };

  const daysShown = useMemo(() => {
    if (view === "Day") return [new Date(anchor)];
    const start = startOfWeek(anchor);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [view, anchor]);

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of items.filter((e) => e.status !== "cancelled")) {
      const k = dayKey(new Date(e.start_at));
      map.set(k, [...(map.get(k) ?? []), e]);
    }
    return map;
  }, [items]);

  const agendaDays = useMemo(
    () =>
      [...byDay.entries()]
        .filter(([k]) => k >= dayKey(new Date()))
        .sort(([a], [b]) => (a < b ? -1 : 1)),
    [byDay],
  );

  const shift = (dir: -1 | 1) => {
    const d = new Date(anchor);
    d.setDate(d.getDate() + dir * (view === "Day" ? 1 : 7));
    setAnchor(d);
  };

  useEffect(() => {
    if (view !== "Week" || !gridRef.current) return;
    const el = gridRef.current;
    const todayIdx = daysShown.findIndex(
      (d) => dayKey(d) === dayKey(new Date()),
    );
    if (todayIdx < 0 || el.scrollWidth <= el.clientWidth) return;
    const colWidth = (el.scrollWidth - 56) / 7;
    el.scrollTo({
      left: Math.max(0, 56 + todayIdx * colWidth - el.clientWidth / 2),
    });
  }, [view, daysShown]);

  const now = new Date();
  const nowTop =
    (now.getHours() + now.getMinutes() / 60 - HOUR_START) * PX_PER_HOUR;

  const fail = (err: unknown) =>
    toast(err instanceof Error ? err.message : "That didn't go through.", {
      tone: "error",
    });

  const cancelEvent = (id: string) => {
    cancelEventApi(id)
      .then(() =>
        toast("Event cancelled. Attendees were notified.", { tone: "info" }),
      )
      .catch(fail);
    setCancelling(false);
    setOpenEvent(null);
  };

  // Conflict-free slots with the same duration over the next few days,
  // inside working hours. Mirrors GET /calendar/availability.
  const suggestSlots = (ev: CalendarEvent): Date[] => {
    const duration =
      new Date(ev.end_at).getTime() - new Date(ev.start_at).getTime();
    const busy = items.filter(
      (e) => e.status !== "cancelled" && e.id !== ev.id,
    );
    const slots: Date[] = [];
    for (let day = 1; day <= 5 && slots.length < 3; day++) {
      for (let half = 18; half < 34 && slots.length < 3; half++) {
        // 09:00 to 17:00
        const start = new Date();
        start.setDate(start.getDate() + day);
        start.setHours(Math.floor(half / 2), (half % 2) * 30, 0, 0);
        const end = new Date(start.getTime() + duration);
        if (end.getHours() >= 17 && end.getMinutes() > 0) continue;
        const clash = busy.some(
          (e) => new Date(e.start_at) < end && new Date(e.end_at) > start,
        );
        if (!clash) {
          slots.push(start);
          half += Math.ceil(duration / 1800000); // skip past this slot
        }
      }
    }
    return slots;
  };

  const applySlot = (ev: CalendarEvent, start: Date) => {
    const duration =
      new Date(ev.end_at).getTime() - new Date(ev.start_at).getTime();
    const end = new Date(start.getTime() + duration);
    saveEvent(
      { ...ev, start_at: start.toISOString(), end_at: end.toISOString() },
      false,
    )
      .then(() =>
        toast(
          `Rescheduled to ${fmtDay(start.toISOString())} at ${fmtTime(start.toISOString())}. Attendees notified.`,
        ),
      )
      .catch(fail);
    setRescheduling(false);
    setOpenEvent(null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-navy">
            Calendar
          </h1>
          <p className="text-sm text-ink-muted">
            Google Calendar · all times in {settings.timezone} ({tzAbbr})
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" aria-hidden />
          New event
        </Button>
      </div>

      {/* Create modal */}
      {creating && (
        <Modal
          label={editingId ? "Edit event" : "New event"}
          onClose={() => {
            setCreating(false);
            setEditingId(null);
            setDraftError("");
          }}
          panelClassName="w-full max-w-120"
        >
          <Card className="max-h-[90vh] overflow-y-auto p-6">
            <button
              aria-label="Close"
              onClick={() => {
                setCreating(false);
                setEditingId(null);
                setDraftError("");
              }}
              className="absolute right-4 top-4 flex size-8 cursor-pointer items-center justify-center rounded-lg text-ink-muted hover:bg-indigo-50"
            >
              <X className="size-4" aria-hidden />
            </button>
            <h2 className="text-lg font-semibold text-navy">
              {editingId ? "Edit event" : "New event"}
            </h2>
            <div className="mt-5 space-y-4">
              <label className="block text-sm font-medium text-navy">
                Title
                <input
                  value={draft.title}
                  onChange={(e) =>
                    setDraft({ ...draft, title: e.target.value })
                  }
                  placeholder="Lunch with Kemi"
                  className="mt-1.5 h-11 w-full rounded-control border border-line bg-white px-3.5 text-[15px] font-normal text-navy placeholder:text-ink-muted focus:border-indigo-300"
                />
              </label>
              <div className="grid grid-cols-3 gap-3">
                <label className="col-span-1 text-sm font-medium text-navy">
                  Date
                  <input
                    type="date"
                    value={draft.date}
                    onChange={(e) =>
                      setDraft({ ...draft, date: e.target.value })
                    }
                    className="mt-1.5 h-11 w-full rounded-control border border-line bg-white px-2.5 text-sm font-normal"
                  />
                </label>
                <label className="text-sm font-medium text-navy">
                  Start
                  <input
                    type="time"
                    value={draft.start}
                    onChange={(e) =>
                      setDraft({ ...draft, start: e.target.value })
                    }
                    className="mt-1.5 h-11 w-full rounded-control border border-line bg-white px-2.5 text-sm font-normal"
                  />
                </label>
                <label className="text-sm font-medium text-navy">
                  End
                  <input
                    type="time"
                    value={draft.end}
                    onChange={(e) =>
                      setDraft({ ...draft, end: e.target.value })
                    }
                    className="mt-1.5 h-11 w-full rounded-control border border-line bg-white px-2.5 text-sm font-normal"
                  />
                </label>
              </div>
              <p className="text-xs text-ink-muted">
                All times in {settings.timezone} ({tzAbbr}).
              </p>
              <label className="block text-sm font-medium text-navy">
                Attendees{" "}
                <span className="font-normal text-ink-muted">
                  (emails, comma-separated)
                </span>
                <input
                  value={draft.attendees}
                  onChange={(e) =>
                    setDraft({ ...draft, attendees: e.target.value })
                  }
                  placeholder="kemi@client.com"
                  className="mt-1.5 h-11 w-full rounded-control border border-line bg-white px-3.5 text-[15px] font-normal text-navy placeholder:text-ink-muted focus:border-indigo-300"
                />
              </label>
              <label className="block text-sm font-medium text-navy">
                Location{" "}
                <span className="font-normal text-ink-muted">(optional)</span>
                <input
                  value={draft.location}
                  onChange={(e) =>
                    setDraft({ ...draft, location: e.target.value })
                  }
                  className="mt-1.5 h-11 w-full rounded-control border border-line bg-white px-3.5 text-[15px] font-normal text-navy focus:border-indigo-300"
                />
              </label>
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-navy">
                <input
                  type="checkbox"
                  checked={draft.meet}
                  onChange={(e) =>
                    setDraft({ ...draft, meet: e.target.checked })
                  }
                  className="size-4 cursor-pointer accent-indigo-900"
                />
                Add Google Meet link
              </label>
              {draftError && (
                <p
                  className={cn(
                    "text-sm",
                    draftError.startsWith("Heads up")
                      ? "text-warning-ink"
                      : "text-danger",
                  )}
                  role="alert"
                >
                  {draftError}
                </p>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setCreating(false);
                    setEditingId(null);
                    setDraftError("");
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={createEvent}>
                  {editingId ? "Save changes" : "Create event"}
                </Button>
              </div>
            </div>
          </Card>
        </Modal>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            aria-label="Previous"
            onClick={() => shift(-1)}
            className="flex size-9 cursor-pointer items-center justify-center rounded-control border border-line bg-white text-ink-muted hover:border-indigo-300"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAnchor(new Date())}
          >
            Today
          </Button>
          <button
            aria-label="Next"
            onClick={() => shift(1)}
            className="flex size-9 cursor-pointer items-center justify-center rounded-control border border-line bg-white text-ink-muted hover:border-indigo-300"
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
          <p className="ml-2 text-sm font-semibold text-navy">
            {anchor.toLocaleDateString("en-GB", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div
          role="tablist"
          className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl bg-indigo-50 p-1"
        >
          {views.map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={cn(
                "shrink-0 cursor-pointer rounded-[9px] px-4 py-1.5 text-sm font-medium transition-colors",
                view === v
                  ? "bg-white text-indigo-900 shadow-card"
                  : "text-ink-muted hover:text-navy",
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Grid views */}
      {view !== "Agenda" ? (
        <Card className="overflow-x-auto" ref={gridRef}>
          <div className="min-w-160">
            {/* Day headers */}
            <div
              className="grid border-b border-line"
              style={{
                gridTemplateColumns: `56px repeat(${daysShown.length}, 1fr)`,
              }}
            >
              <div />
              {daysShown.map((d) => {
                const isToday = dayKey(d) === dayKey(new Date());
                return (
                  <div
                    key={d.toISOString()}
                    className="border-l border-line px-2 py-2.5 text-center"
                  >
                    <p className="text-[11px] uppercase tracking-wide text-ink-muted">
                      {d.toLocaleDateString("en-GB", { weekday: "short" })}
                    </p>
                    <p
                      className={cn(
                        "mx-auto mt-0.5 flex size-7 items-center justify-center rounded-full text-sm font-semibold",
                        isToday ? "bg-indigo-900 text-white" : "text-navy",
                      )}
                    >
                      {d.getDate()}
                    </p>
                  </div>
                );
              })}
            </div>
            {/* Hour grid */}
            <div
              className="relative grid"
              style={{
                gridTemplateColumns: `56px repeat(${daysShown.length}, 1fr)`,
              }}
            >
              {/* Hour labels */}
              <div>
                {Array.from({ length: HOUR_END - HOUR_START }, (_, i) => (
                  <div
                    key={i}
                    className="pr-2 text-right text-[11px] text-ink-muted"
                    style={{ height: PX_PER_HOUR }}
                  >
                    <span className="relative -top-1.5">
                      {((HOUR_START + i + 11) % 12) + 1}
                      {HOUR_START + i < 12 ? "am" : "pm"}
                    </span>
                  </div>
                ))}
              </div>
              {/* Day columns */}
              {daysShown.map((d) => {
                const isToday = dayKey(d) === dayKey(new Date());
                return (
                  <div
                    key={d.toISOString()}
                    className={cn(
                      "relative border-l border-line",
                      isToday && "bg-cyan-500/4",
                    )}
                    style={{ height: (HOUR_END - HOUR_START) * PX_PER_HOUR }}
                  >
                    {Array.from(
                      { length: HOUR_END - HOUR_START - 1 },
                      (_, i) => (
                        <div
                          key={i}
                          className="absolute inset-x-0 border-b border-line/60"
                          style={{ top: (i + 1) * PX_PER_HOUR }}
                        />
                      ),
                    )}
                    {isToday &&
                      nowTop > 0 &&
                      nowTop < (HOUR_END - HOUR_START) * PX_PER_HOUR && (
                        <div
                          className="absolute inset-x-0 z-10 flex items-center"
                          style={{ top: nowTop }}
                          aria-hidden
                        >
                          <span className="size-2 -translate-x-1 rounded-full bg-danger" />
                          <span className="h-px flex-1 bg-danger" />
                        </div>
                      )}
                    {(byDay.get(dayKey(d)) ?? []).map((e) => (
                      <EventBlock
                        key={e.id}
                        event={e}
                        onClick={() => setOpenEvent(e)}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      ) : (
        /* Agenda view */
        <div className="space-y-4">
          {agendaDays.length === 0 ? (
            <Card className="flex flex-col items-center gap-3 p-12 text-center">
              <CalendarDays className="size-8 text-violet-300" aria-hidden />
              <p className="font-medium text-navy">No upcoming events</p>
              <p className="max-w-80 text-sm text-ink-muted">
                Ask Amiva to schedule something, like “book lunch with Kemi on
                Thursday”.
              </p>
            </Card>
          ) : (
            agendaDays.map(([k, evts]) => (
              <section key={k}>
                <h2 className="mb-2 text-sm font-semibold text-ink-muted">
                  {fmtDay(`${k}T12:00:00Z`)}
                </h2>
                <div className="space-y-2">
                  {evts
                    .sort((a, b) => a.start_at.localeCompare(b.start_at))
                    .map((e) => (
                      <Card
                        key={e.id}
                        className="flex cursor-pointer items-center gap-4 px-4 py-3 hover:border-indigo-300"
                        onClick={() => setOpenEvent(e)}
                      >
                        <div className="w-21.5 shrink-0 text-right">
                          <p className="text-sm font-semibold tabular-nums text-navy">
                            {fmtTime(e.start_at)}
                          </p>
                          <p className="text-[11px] tabular-nums text-ink-muted">
                            {fmtTime(e.end_at)}
                          </p>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] font-medium text-navy">
                            {e.title}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-ink-muted">
                            {e.conference_url ? (
                              <>
                                <Video className="size-3" aria-hidden /> Google
                                Meet
                              </>
                            ) : e.location ? (
                              <>
                                <MapPin className="size-3" aria-hidden />{" "}
                                {e.location}
                              </>
                            ) : null}
                          </p>
                        </div>
                        {e.status === "tentative" && (
                          <Chip tone="violet">Tentative</Chip>
                        )}
                        {e.attendees.length > 0 && (
                          <span className="flex items-center gap-1 text-xs text-ink-muted">
                            <Users className="size-3.5" aria-hidden />
                            {e.attendees.length}
                          </span>
                        )}
                      </Card>
                    ))}
                </div>
              </section>
            ))
          )}
        </div>
      )}

      {/* Event modal */}
      {openEvent && (
        <Modal
          label={openEvent.title}
          onClose={() => {
            setOpenEvent(null);
            setCancelling(false);
            setRescheduling(false);
          }}
          panelClassName="w-full max-w-110"
        >
          <Card className="p-6">
            <button
              aria-label="Close"
              onClick={() => {
                setOpenEvent(null);
                setCancelling(false);
                setRescheduling(false);
              }}
              className="absolute right-4 top-4 flex size-8 cursor-pointer items-center justify-center rounded-lg text-ink-muted hover:bg-indigo-50"
            >
              <X className="size-4" aria-hidden />
            </button>
            <h2 className="pr-8 text-lg font-semibold text-navy">
              {openEvent.title}
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              {fmtDay(openEvent.start_at)} · {fmtTime(openEvent.start_at)}–
              {fmtTime(openEvent.end_at)} ({tzAbbr})
            </p>
            <div className="mt-4 space-y-2.5 text-sm text-navy">
              {openEvent.conference_url && (
                <p className="flex items-center gap-2">
                  <Video className="size-4 text-violet-500" aria-hidden />
                  <a
                    href={openEvent.conference_url}
                    className="text-indigo-900 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Join Google Meet
                  </a>
                </p>
              )}
              {openEvent.location && (
                <p className="flex items-center gap-2">
                  <MapPin className="size-4 text-violet-500" aria-hidden />
                  {openEvent.location}
                </p>
              )}
              {openEvent.attendees.length > 0 && (
                <div className="flex items-start gap-2">
                  <Users
                    className="mt-0.5 size-4 text-violet-500"
                    aria-hidden
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {openEvent.attendees.map((a) => (
                      <Chip
                        key={a.email}
                        tone={
                          a.response_status === "accepted"
                            ? "success"
                            : "neutral"
                        }
                      >
                        {a.name}
                      </Chip>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {cancelling ? (
              <div className="mt-5 rounded-xl border border-danger/40 bg-danger/5 p-4">
                <p className="text-sm font-medium text-navy">
                  Cancel this event?
                </p>
                <p className="mt-1 text-xs text-ink-muted">
                  {openEvent.attendees.length > 0
                    ? "Attendees will be notified of the cancellation."
                    : "This event will be removed from your calendar."}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => cancelEvent(openEvent.id)}
                  >
                    Yes, cancel event
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCancelling(false)}
                  >
                    Keep it
                  </Button>
                </div>
              </div>
            ) : rescheduling ? (
              <div className="mt-5 rounded-xl border border-cyan-500/40 bg-cyan-500/8 p-4">
                <p className="text-sm font-medium text-navy">
                  Free slots that fit everyone:
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {suggestSlots(openEvent).map((slot) => (
                    <button
                      key={slot.toISOString()}
                      onClick={() => applySlot(openEvent, slot)}
                      className="cursor-pointer rounded-full border border-cyan-600/50 bg-white px-3.5 py-1.5 text-[13px] font-medium text-navy hover:border-cyan-600"
                    >
                      {fmtDay(slot.toISOString())} ·{" "}
                      {fmtTime(slot.toISOString())}
                    </button>
                  ))}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setRescheduling(false);
                      startEdit(openEvent);
                    }}
                  >
                    Pick my own time
                  </Button>
                </div>
                <button
                  onClick={() => setRescheduling(false)}
                  className="mt-2 cursor-pointer text-xs text-ink-muted hover:text-navy"
                >
                  Never mind
                </button>
              </div>
            ) : (
              <div className="mt-5 flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => startEdit(openEvent)}
                >
                  Edit
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setRescheduling(true)}
                >
                  Reschedule
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto text-danger"
                  onClick={() => setCancelling(true)}
                >
                  Cancel event
                </Button>
              </div>
            )}
          </Card>
        </Modal>
      )}
    </div>
  );
}
