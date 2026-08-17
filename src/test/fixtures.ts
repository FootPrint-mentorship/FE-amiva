/**
 * Test fixtures — the seed data that used to live in the retired
 * src/lib/mock.ts (plus the notification seed from data/notifications.ts,
 * the "Ada Obi" profile from lib/stores.ts and MOCK_SESSIONS from
 * data/auth.ts). Every factory returns a FRESH deep copy so a test can
 * mutate its database without leaking into the next one.
 */

import type {
  Reminder,
  Task,
  Memory,
  CalendarEvent,
  PendingConfirmation,
  ChatMessage,
  AuditEvent,
} from "@/lib/types";
import type { Settings } from "@/lib/stores";

/* ------------------------------ time helpers ----------------------------- */

const today = () => new Date();

/** ISO timestamp at h:m local time, `dayOffset` days from today. */
export const iso = (h: number, m = 0, dayOffset = 0) => {
  const d = today();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

/** YYYY-MM-DD key `dayOffset` days from today (local). */
export const dateKey = (dayOffset = 0) => {
  const d = today();
  d.setDate(d.getDate() + dayOffset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

/* ------------------------------- reminders ------------------------------- */

/** RRULE → human text, as the backend computes it (the frontend never
 * parses RRULEs). Keyed on every rule the fixtures and the reminder modal
 * can produce. */
export const RRULE_HUMAN: Record<string, string> = {
  "FREQ=MONTHLY;BYDAY=-1FR": "Every last Friday of the month",
  "FREQ=WEEKLY;BYDAY=FR": "Every Friday",
  "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR": "Every weekday",
  "FREQ=DAILY": "Every day",
};

export function makeReminders(): Reminder[] {
  return [
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
}

/* --------------------------------- tasks --------------------------------- */

export function makeTasks(): Task[] {
  return [
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
    // Former "lists" live on as categorised checklist tasks.
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
}

/* -------------------------------- calendar ------------------------------- */

/** Today's events (a subset of the week's events). */
export function makeEvents(): CalendarEvent[] {
  return [
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
}

/** Events across the week (includes today's `makeEvents()`). */
export function makeWeekEvents(): CalendarEvent[] {
  return [
    ...makeEvents(),
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
}

/* -------------------------------- memories ------------------------------- */

export function makeMemories(): Memory[] {
  return [
    {
      id: "mem_01",
      content:
        "Landlord's account: GTB 0123456789, Musa Ibrahim. Rent due last Friday of every month.",
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
      content:
        "Kemi prefers WhatsApp voice notes over email for quick updates. Formal docs by email only.",
      category: "people",
      tags: ["kemi", "client"],
      source_channel: "whatsapp",
      favorite: false,
      archived: false,
      created_at: iso(15, 30, -3),
    },
    {
      id: "mem_05",
      content:
        "Nairobi trip: staying at Sarova Stanley, booking ref 6HJQZP. Airport pickup arranged by James (+254 712 345 678).",
      category: "travel",
      tags: ["nairobi", "august"],
      source_channel: "whatsapp",
      favorite: true,
      archived: false,
      created_at: iso(12, 0, -2),
    },
    {
      id: "mem_06",
      content:
        "App idea: recurring 'money dates' feature: weekly finance check-in with summary of spending vs budget.",
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
}

/* ----------------------------- confirmations ----------------------------- */

export function makePendingConfirmations(): PendingConfirmation[] {
  return [
    {
      id: "cnf_01",
      action_type: "calendar.reschedule",
      summary:
        "Move 'Investor sync with Tunde' to Fri 1 Aug, 9:00–9:30 AM (WAT). Attendees will be notified.",
      risk: "medium",
      expires_at: iso(23, 59),
    },
  ];
}

/* ------------------------------ chat thread ------------------------------ */

/** The old seed conversation, oldest first. The fake serves it through
 * GET /assistant/messages (newest first, text-only — the API's history has
 * no resource/confirmation cards). */
export function makeChatSeed(): ChatMessage[] {
  return [
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
      at: iso(9, 42),
    },
  ];
}

/** The canned assistant reply the mock mode used to produce. */
export const CANNED_ASSISTANT_REPLY =
  "This preview runs on mock data. Once the backend is connected I'll handle that for real. Here's how a confirmation looks:";

/* ------------------------------ audit trail ------------------------------ */

export function makeAuditEvents(): AuditEvent[] {
  return [
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
      created_at: iso(11, 12, -6),
    },
  ];
}

/* ----------------------------- notifications ----------------------------- */

/** Rows in the API's shape (data/notifications.ts maps them for display). */
export type ApiNotification = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  resource_ref: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
};

export function makeNotifications(): ApiNotification[] {
  const now = Date.now();
  return [
    {
      id: "ntf_01",
      kind: "reminder.delivered",
      title: "Reminder delivered",
      body: "“Pay NEPA bill” was delivered on WhatsApp at 10:00 AM.",
      resource_ref: null,
      read_at: null,
      created_at: new Date(now - 45 * 60000).toISOString(),
    },
    {
      id: "ntf_02",
      kind: "calendar.updated",
      title: "Calendar updated",
      body: "“Investor sync with Tunde” moved to Friday 9:00 AM.",
      resource_ref: null,
      read_at: null,
      created_at: new Date(now - 3 * 3600000).toISOString(),
    },
    {
      id: "ntf_03",
      kind: "digest.weekly",
      title: "Weekly summary ready",
      body: "You completed 12 tasks last week. See what's ahead.",
      resource_ref: null,
      read_at: new Date(now - 25 * 3600000).toISOString(),
      created_at: new Date(now - 26 * 3600000).toISOString(),
    },
  ];
}

/* ------------------------- Ada Obi (user profile) ------------------------ */

/** The user resource /users/me and the auth endpoints answer with. */
export type ApiUser = {
  id: string;
  email: string;
  phone: string | null;
  name: string;
  preferred_name: string | null;
  timezone: string;
  email_verified?: boolean;
  phone_verified?: boolean;
  whatsapp_linked?: boolean;
  profile_complete: boolean;
  features?: Record<string, boolean>;
};

export function makeAdaUser(): ApiUser {
  return {
    id: "usr_ada",
    email: "ada@example.com",
    phone: "+234 801 234 5678",
    name: "Ada Obi",
    preferred_name: "Ada",
    timezone: "Africa/Lagos",
    email_verified: true,
    phone_verified: true,
    whatsapp_linked: true,
    profile_complete: true,
    features: {
      chat: true,
      reminders: true,
      calendar: true,
      tasks: true,
      memories: true,
    },
  };
}

/** The old settings seed — what absorbUser(makeAdaUser()) plus the
 * notification prefs used to leave in the settings store. Tests render
 * pages without the app layout (which would call /users/me), so the setup
 * seeds the store with this directly. */
export function makeAdaSettings(): Settings {
  return {
    fullName: "Ada Obi",
    preferredName: "Ada",
    email: "ada@example.com",
    phone: "+234 801 234 5678",
    timezone: "Africa/Lagos",
    emailVerified: true,
    phoneVerified: true,
    hasPassword: true,
    matrix: {
      Reminders: ["WhatsApp", "Email"],
      Tasks: ["WhatsApp"],
      "Daily agenda": ["WhatsApp"],
      "Product updates": ["Email"],
    },
    quietHours: true,
    theme: "system",
    integrations: { whatsapp: true, calendar: true },
    features: {
      chat: true,
      reminders: true,
      calendar: true,
      tasks: true,
      memories: true,
    },
    hydrated: true,
  };
}

/** Notification preferences in the API's shape (GET/PUT
 * /users/me/preferences/notifications) — mirrors makeAdaSettings().matrix. */
export function makeNotificationPrefs() {
  return {
    matrix: {
      reminders: ["whatsapp", "email"],
      tasks: ["whatsapp"],
      agenda: ["whatsapp"],
      product: ["email"],
    } as Record<string, string[]>,
    quiet_hours: {
      start: "22:00",
      end: "07:00",
      timezone: "Africa/Lagos",
      urgent_override: true,
    } as { start: string; end: string; timezone: string; urgent_override?: boolean } | null,
    daily_agenda_enabled: true,
    daily_agenda_time: "07:30" as string | null,
  };
}

/* ------------------------- sessions & integrations ------------------------ */

export type SessionRow = {
  id: string;
  device_label: string | null;
  ip: string | null;
  user_agent: string | null;
  current: boolean;
  last_used_at: string | null;
  created_at: string;
};

export function makeSessions(): SessionRow[] {
  return [
    {
      id: "ses-this",
      device_label: "MacBook · Lagos",
      ip: null,
      user_agent: null,
      current: true,
      last_used_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
  ];
}

export type IntegrationRow = {
  id: string;
  provider: string;
  account_email: string;
  scopes: string[];
  status: string;
  connected_at: string;
  features: Record<string, boolean>;
};

/** Ada's Google Calendar is connected (matches integrations.calendar: true
 * in the settings seed — hydrateIntegrations() must agree with it). */
export function makeIntegrations(): IntegrationRow[] {
  return [
    {
      id: "int_01",
      provider: "google",
      account_email: "ada@example.com",
      scopes: ["calendar"],
      status: "connected",
      connected_at: iso(9, 0, -14),
      features: { calendar: true },
    },
  ];
}

/* --------------------------------- the db -------------------------------- */

export function makeDb() {
  return {
    reminders: makeReminders(),
    tasks: makeTasks(),
    weekEvents: makeWeekEvents(),
    memories: makeMemories(),
    confirmations: makePendingConfirmations().map((c) => ({
      ...c,
      status: "pending" as "pending" | "approved" | "rejected",
    })),
    chat: makeChatSeed(),
    audit: makeAuditEvents(),
    notifications: makeNotifications(),
    user: makeAdaUser(),
    prefs: makeNotificationPrefs(),
    sessions: makeSessions(),
    integrations: makeIntegrations(),
  };
}

export type FakeDb = ReturnType<typeof makeDb>;
