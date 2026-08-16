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
  category: string | null;
  subtasks: { id: string; title: string; completed: boolean }[];
};

export const taskCategories = [
  "Personal",
  "Work",
  "Shopping",
  "Travel",
  "Finance",
  "Reading",
  "Errands",
] as const;

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

const dateKey = (dayOffset = 0) => {
  const d = new Date(today);
  d.setDate(d.getDate() + dayOffset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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
    title: "Investor sync with Tunde",
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
    title: "Design review: onboarding flow",
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
    due_date: dateKey(0),
    priority: "high",
    status: "open",
    project: "Client: Kemi",
    category: "Work",
    subtasks: [
      { id: "sub_01", title: "Draft pricing section", completed: true },
      { id: "sub_02", title: "Final review", completed: false },
    ],
  },
  {
    id: "tsk_02",
    title: "Review Q3 budget draft",
    due_date: dateKey(0),
    priority: "medium",
    status: "open",
    project: null,
    category: "Finance",
    subtasks: [],
  },
  {
    id: "tsk_03",
    title: "Book flight to Nairobi",
    due_date: dateKey(2),
    priority: "urgent",
    status: "open",
    project: null,
    category: "Travel",
    subtasks: [],
  },
  // Former "lists" now live here as categorised checklist tasks.
  {
    id: "tsk_04",
    title: "Weekly shopping",
    due_date: null,
    priority: "low",
    status: "open",
    project: null,
    category: "Shopping",
    subtasks: [
      { id: "sub_10", title: "Rice 5kg", completed: true },
      { id: "sub_11", title: "Beans", completed: true },
      { id: "sub_12", title: "Titus fish", completed: false },
      { id: "sub_13", title: "Palm oil", completed: false },
      { id: "sub_14", title: "Garri", completed: false },
    ],
  },
  {
    id: "tsk_05",
    title: "Nairobi trip packing",
    due_date: null,
    priority: "medium",
    status: "open",
    project: null,
    category: "Travel",
    subtasks: [
      { id: "sub_15", title: "Passport", completed: false },
      { id: "sub_16", title: "Chargers and power bank", completed: false },
      { id: "sub_17", title: "Business cards", completed: false },
    ],
  },
  {
    id: "tsk_06",
    title: "Books to read",
    due_date: null,
    priority: "low",
    status: "open",
    project: null,
    category: "Reading",
    subtasks: [
      { id: "sub_18", title: "The Mom Test", completed: true },
      { id: "sub_19", title: "Zero to One", completed: false },
    ],
  },
];

export const pendingConfirmations: PendingConfirmation[] = [
  {
    id: "cnf_01",
    action_type: "calendar.reschedule",
    summary:
      "Move 'Investor sync with Tunde' to Fri 1 Aug, 9:00–9:30 AM (WAT). Attendees will be notified.",
    risk: "medium",
    expires_at: iso(23, 59),
  },
];

/** Events across the week for the calendar screen (includes today's `events`). */
export const weekEvents: CalendarEvent[] = [
  ...events,
  {
    id: "evt_04",
    title: "1:1 with Abraham",
    start_at: iso(11, 0, 1),
    end_at: iso(11, 30, 1),
    all_day: false,
    location: null,
    conference_url: "https://meet.google.com/def",
    attendees: [{ email: "abraham@amiva.app", name: "Abraham", response_status: "accepted" }],
    status: "confirmed",
  },
  {
    id: "evt_05",
    title: "Product review",
    start_at: iso(14, 0, 1),
    end_at: iso(15, 0, 1),
    all_day: false,
    location: "Office · Boardroom",
    conference_url: null,
    attendees: [],
    status: "confirmed",
  },
  {
    id: "evt_06",
    title: "Flight to Nairobi (KQ533)",
    start_at: iso(9, 15, 3),
    end_at: iso(13, 30, 3),
    all_day: false,
    location: "MMA Terminal 1",
    conference_url: null,
    attendees: [],
    status: "confirmed",
  },
  {
    id: "evt_07",
    title: "Client dinner with Kemi",
    start_at: iso(19, 0, 2),
    end_at: iso(20, 30, 2),
    all_day: false,
    location: "Victoria Island",
    conference_url: null,
    attendees: [{ email: "kemi@client.com", name: "Kemi", response_status: "needsAction" }],
    status: "tentative",
  },
  {
    id: "evt_08",
    title: "Deep work: proposal",
    start_at: iso(10, 0, -1),
    end_at: iso(12, 0, -1),
    all_day: false,
    location: null,
    conference_url: null,
    attendees: [],
    status: "confirmed",
  },
];

export type Memory = {
  id: string;
  content: string;
  category: "personal" | "work" | "people" | "travel" | "finance" | "ideas" | "other";
  tags: string[];
  source_channel: "whatsapp" | "web";
  favorite: boolean;
  archived: boolean;
  created_at: string;
};

export const memories: Memory[] = [
  {
    id: "mem_01",
    content: "Landlord's account: GTB 0123456789, Musa Ibrahim. Rent due last Friday of every month.",
    category: "finance",
    tags: ["landlord", "rent"],
    source_channel: "whatsapp",
    favorite: true,
    archived: false,
    created_at: iso(9, 12, -6),
  },
  {
    id: "mem_02",
    content: "Mum's blood pressure medication: Amlodipine 5mg, refill at HealthPlus Lekki.",
    category: "people",
    tags: ["mum", "health"],
    source_channel: "whatsapp",
    favorite: false,
    archived: false,
    created_at: iso(18, 40, -12),
  },
  {
    id: "mem_03",
    content: "Wifi password at the office: Vertex2026!",
    category: "work",
    tags: ["office"],
    source_channel: "web",
    favorite: false,
    archived: false,
    created_at: iso(10, 5, -20),
  },
  {
    id: "mem_04",
    content: "Kemi prefers WhatsApp voice notes over email for quick updates. Formal docs by email only.",
    category: "people",
    tags: ["kemi", "client"],
    source_channel: "whatsapp",
    favorite: false,
    archived: false,
    created_at: iso(15, 30, -3),
  },
  {
    id: "mem_05",
    content: "Nairobi trip: staying at Sarova Stanley, booking ref 6HJQZP. Airport pickup arranged by James (+254 712 345 678).",
    category: "travel",
    tags: ["nairobi", "august"],
    source_channel: "whatsapp",
    favorite: true,
    archived: false,
    created_at: iso(12, 0, -2),
  },
  {
    id: "mem_06",
    content: "App idea: recurring 'money dates' feature: weekly finance check-in with summary of spending vs budget.",
    category: "ideas",
    tags: ["product"],
    source_channel: "web",
    favorite: false,
    archived: false,
    created_at: iso(22, 15, -8),
  },
  {
    id: "mem_07",
    content: "Generator service contact: Emeka, +234 803 555 1234. Last serviced in May.",
    category: "personal",
    tags: ["home"],
    source_channel: "whatsapp",
    favorite: false,
    archived: false,
    created_at: iso(8, 45, -30),
  },
];

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  resource?: { kind: "reminder" | "task" | "event"; title: string; meta: string };
  confirmation?: PendingConfirmation;
  at: string;
};

export const chatSeed: ChatMessage[] = [
  {
    id: "msg_01",
    role: "user",
    text: "Remind me to pay rent on Friday morning",
    at: iso(9, 40),
  },
  {
    id: "msg_02",
    role: "assistant",
    text: "Done. I'll remind you Friday 31 Jul, 9:00 AM (WAT).",
    resource: { kind: "reminder", title: "Pay rent", meta: "Fri 31 Jul · 9:00 AM WAT · WhatsApp" },
    at: iso(9, 40),
  },
  {
    id: "msg_03",
    role: "user",
    text: "Move my 2pm with Tunde to Friday morning",
    at: iso(9, 42),
  },
  {
    id: "msg_04",
    role: "assistant",
    text: "I found 'Investor sync' with Tunde today at 1:00 PM. Friday 9:00–9:30 AM is free for both of you. Move it?",
    confirmation: pendingConfirmations[0],
    at: iso(9, 42),
  },
];

export type AuditEvent = {
  id: string;
  action: string;
  module: "reminders" | "calendar" | "memory" | "tasks" | "account";
  summary: string;
  risk: "low" | "medium" | "high";
  channel: "whatsapp" | "web";
  result: "success" | "failure";
  approval?: string;
  created_at: string;
};

export const auditEvents: AuditEvent[] = [
  {
    id: "aud_02",
    action: "reminder.create",
    module: "reminders",
    summary: "Created reminder “Pay NEPA bill”, every last Friday at 10:00 AM",
    risk: "low",
    channel: "whatsapp",
    result: "success",
    created_at: iso(9, 41),
  },
  {
    id: "aud_03",
    action: "calendar.reschedule",
    module: "calendar",
    summary: "Moved “Investor sync with Tunde” to Fri 9:00 AM; attendees notified",
    risk: "medium",
    channel: "whatsapp",
    result: "success",
    approval: "Approved by you via WhatsApp, today 09:44",
    created_at: iso(9, 44),
  },
  {
    id: "aud_04",
    action: "memory.save",
    module: "memory",
    summary: "Saved memory “Nairobi trip: Sarova Stanley…” under Travel",
    risk: "low",
    channel: "whatsapp",
    result: "success",
    created_at: iso(12, 0, -2),
  },
  {
    id: "aud_05",
    action: "calendar.create",
    module: "calendar",
    summary: "Created “Client dinner with Kemi”: provider timeout, retried and failed",
    risk: "medium",
    channel: "web",
    result: "failure",
    created_at: iso(18, 20, -2),
  },
  {
    id: "aud_06",
    action: "memory.delete_permanent",
    module: "memory",
    summary: "Permanently deleted 1 memory (category: Personal)",
    risk: "high",
    channel: "web",
    result: "success",
    approval: "Confirmed by you via web, 20 Jul 11:12",
    created_at: iso(11, 12, -6),
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
