/**
 * API resource types, shaped exactly like AMIVA-BACKEND-SPEC.md §5 /
 * openapi.yaml. Screens and repositories import types from here and nowhere
 * else. (Split out of the retired mock.ts, 17 Aug 2026 — the mock layer is
 * gone; the real API is the only data source.)
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
  // Recurrence (§5.4 amendment): a series master carries the rrule +
  // server-humanized label; Google-expanded instances carry the master's id.
  rrule?: string | null;
  recurrence_human?: string | null;
  recurring_event_id?: string | null;
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

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  resource?: { kind: "reminder" | "task" | "event"; title: string; meta: string };
  confirmation?: PendingConfirmation;
  at: string;
};

/** GET /activity rows (ActivityOut in the backend). */
export type AuditEvent = {
  id: string;
  action: string;
  module: string | null;
  summary: string;
  risk: "low" | "medium" | "high";
  channel: string | null;
  result: string;
  created_at: string;
};
