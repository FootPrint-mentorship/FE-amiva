/**
 * Mock fixtures shaped exactly like the API resources in AMIVA-BACKEND-SPEC.md §5.
 * When the backend exists, replace this module with the generated API client —
 * screens import types + data from here and nowhere else.
 */

export type Reminder = {
  id: string;
  title: string;
  notes: string | null;
  due_at: string; // ISO UTC
  timezone: string;
  rrule: string | null;
  recurrence_human: string | null;
  channels: ("whatsapp" | "email" | "push")[];
  status: "scheduled" | "completed" | "snoozed" | "paused" | "cancelled";
  snoozed_until: string | null;
  next_fire_at: string | null;
  source: "whatsapp" | "web" | "system";
};

export type CalendarEvent = {
  id: string;
  title: string;
  start_at: string;
  end_at: string;
  all_day: boolean;
  location: string | null;
  conference_url: string | null;
  attendees: { email: string; name: string; response_status: string }[];
  status: "confirmed" | "tentative" | "cancelled";
};

export type Task = {
  id: string;
  title: string;
  due_date: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "completed";
  project: string | null;
  subtasks: { id: string; title: string; completed: boolean }[];
};

export type PendingConfirmation = {
  id: string;
  action_type: string;
  summary: string;
  risk: "medium" | "high";
  expires_at: string;
};

export const user = {
  preferred_name: "Ada",
  timezone: "Africa/Lagos",
  tz_abbr: "WAT",
};

const today = new Date();
const iso = (h: number, m = 0, dayOffset = 0) => {
  const d = new Date(today);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

export const agendaSummary =
  "You have 3 meetings today, with a free stretch from 2:30 PM. Two reminders are due this morning, and the proposal for Kemi is due by end of day.";

export const events: CalendarEvent[] = [
  {
    id: "evt_01",
    title: "Team standup",
    start_at: iso(9, 30),
    end_at: iso(9, 45),
    all_day: false,
    location: null,
    conference_url: "https://meet.google.com/abc",
    attendees: [
      { email: "team@vertex.com", name: "Product team", response_status: "accepted" },
    ],
    status: "confirmed",
  },
  {
    id: "evt_02",
    title: "Investor sync — Tunde",
    start_at: iso(13, 0),
    end_at: iso(13, 30),
    all_day: false,
    location: "Google Meet",
    conference_url: "https://meet.google.com/xyz",
    attendees: [{ email: "tunde@vc.com", name: "Tunde", response_status: "accepted" }],
    status: "confirmed",
  },
  {
    id: "evt_03",
    title: "Design review — onboarding flow",
    start_at: iso(15, 0),
    end_at: iso(16, 0),
    all_day: false,
    location: "Office · Meeting room 2",
    conference_url: null,
    attendees: [
      { email: "abraham@amiva.app", name: "Abraham", response_status: "tentative" },
    ],
    status: "confirmed",
  },
];

export const reminders: Reminder[] = [
  {
    id: "rem_01",
    title: "Pay NEPA bill",
    notes: null,
    due_at: iso(10, 0),
    timezone: "Africa/Lagos",
    rrule: "FREQ=MONTHLY;BYDAY=-1FR",
    recurrence_human: "Every last Friday of the month",
    channels: ["whatsapp"],
    status: "scheduled",
    snoozed_until: null,
    next_fire_at: iso(10, 0),
    source: "whatsapp",
  },
  {
    id: "rem_02",
    title: "Call Mum",
    notes: "Ask about the weekend trip",
    due_at: iso(18, 0),
    timezone: "Africa/Lagos",
    rrule: null,
    recurrence_human: null,
    channels: ["whatsapp", "email"],
    status: "scheduled",
    snoozed_until: null,
    next_fire_at: iso(18, 0),
    source: "whatsapp",
  },
  {
    id: "rem_03",
    title: "Send weekly report",
    notes: null,
    due_at: iso(16, 30, 1),
    timezone: "Africa/Lagos",
    rrule: "FREQ=WEEKLY;BYDAY=FR",
    recurrence_human: "Every Friday",
    channels: ["email"],
    status: "scheduled",
    snoozed_until: null,
    next_fire_at: iso(16, 30, 1),
    source: "web",
  },
  {
    id: "rem_04",
    title: "Renew passport",
    notes: null,
    due_at: iso(9, 0, 4),
    timezone: "Africa/Lagos",
    rrule: null,
    recurrence_human: null,
    channels: ["whatsapp"],
    status: "snoozed",
    snoozed_until: iso(9, 0, 4),
    next_fire_at: iso(9, 0, 4),
    source: "whatsapp",
  },
  {
    id: "rem_05",
    title: "Standup prep",
    notes: null,
    due_at: iso(9, 0, -1),
    timezone: "Africa/Lagos",
    rrule: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR",
    recurrence_human: "Every weekday",
    channels: ["whatsapp"],
    status: "completed",
    snoozed_until: null,
    next_fire_at: null,
    source: "whatsapp",
  },
];

export const tasks: Task[] = [
  {
    id: "tsk_01",
    title: "Send proposal to Kemi",
    due_date: iso(17, 0).slice(0, 10),
    priority: "high",
    status: "open",
    project: "Client — Kemi",
    subtasks: [
      { id: "sub_01", title: "Draft pricing section", completed: true },
      { id: "sub_02", title: "Final review", completed: false },
    ],
  },
  {
    id: "tsk_02",
    title: "Review Q3 budget draft",
    due_date: iso(17, 0).slice(0, 10),
    priority: "medium",
    status: "open",
    project: "Finance",
    subtasks: [],
  },
  {
    id: "tsk_03",
    title: "Book flight to Nairobi",
    due_date: iso(17, 0, 2).slice(0, 10),
    priority: "urgent",
    status: "open",
    project: null,
    subtasks: [],
  },
];

export const pendingConfirmations: PendingConfirmation[] = [
  {
    id: "cnf_01",
    action_type: "calendar.reschedule",
    summary:
      "Move 'Investor sync — Tunde' to Fri 1 Aug, 9:00–9:30 AM (WAT). Attendees will be notified.",
    risk: "medium",
    expires_at: iso(23, 59),
  },
];

export function fmtTime(isoStr: string) {
  return new Date(isoStr).toLocaleTimeString("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function fmtDay(isoStr: string) {
  const d = new Date(isoStr);
  const now = new Date();
  const diff = Math.floor(
    (new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() -
      new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) /
      86400000
  );
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}
