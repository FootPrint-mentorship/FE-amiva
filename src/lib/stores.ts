import { createStore } from "@/lib/store";
import {
  reminders,
  tasks,
  todoLists,
  memories,
  weekEvents,
  pendingConfirmations,
  type Reminder,
  type Task,
  type TodoList,
  type Memory,
  type CalendarEvent,
  type PendingConfirmation,
} from "@/lib/mock";

/* ---- collections (seeded from mock, shaped like the API) ---- */

export const remindersStore = createStore<Reminder[]>(reminders);
export const tasksStore = createStore<Task[]>(tasks);
export const listsStore = createStore<TodoList[]>(todoLists);
export const memoriesStore = createStore<Memory[]>(memories);
export const eventsStore = createStore<CalendarEvent[]>(weekEvents);

/* ---- confirmations (shared by top bar, Today, Chat, tray) ---- */

export type Confirmation = PendingConfirmation & {
  status: "pending" | "approved" | "rejected";
};

export const confirmationsStore = createStore<Confirmation[]>(
  pendingConfirmations.map((c) => ({ ...c, status: "pending" as const }))
);

export function resolveConfirmation(id: string, status: "approved" | "rejected") {
  confirmationsStore.set((cur) =>
    cur.map((c) => (c.id === id ? { ...c, status } : c))
  );
}

/* ---- notifications ---- */

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  href: string;
  read: boolean;
  at: string;
};

const notifSeed: AppNotification[] = [
  {
    id: "ntf_01",
    title: "Reminder delivered",
    body: "“Pay NEPA bill” was delivered on WhatsApp at 10:00 AM.",
    href: "/app/reminders",
    read: false,
    at: new Date(Date.now() - 45 * 60000).toISOString(),
  },
  {
    id: "ntf_02",
    title: "Calendar updated",
    body: "“Investor sync with Tunde” moved to Friday 9:00 AM.",
    href: "/app/calendar",
    read: false,
    at: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
  {
    id: "ntf_03",
    title: "Weekly summary ready",
    body: "You completed 12 tasks last week. See what's ahead.",
    href: "/app/today",
    read: true,
    at: new Date(Date.now() - 26 * 3600000).toISOString(),
  },
];

export const notificationsStore = createStore<AppNotification[]>(notifSeed);

/* ---- settings (profile, notification prefs, integrations, theme) ---- */

export type Settings = {
  fullName: string;
  preferredName: string;
  timezone: string;
  tone: "Neutral" | "Warm" | "Formal" | "Brief";
  matrix: Record<string, string[]>;
  quietHours: boolean;
  theme: "system" | "light" | "dark";
  integrations: { whatsapp: boolean; calendar: boolean; gmail: boolean };
};

export const settingsStore = createStore<Settings>({
  fullName: "Ada Obi",
  preferredName: "Ada",
  timezone: "Africa/Lagos",
  tone: "Warm",
  matrix: {
    Reminders: ["WhatsApp", "Email"],
    Tasks: ["WhatsApp"],
    "Daily agenda": ["WhatsApp"],
    "Product updates": ["Email"],
  },
  quietHours: true,
  theme: "system",
  integrations: { whatsapp: true, calendar: true, gmail: false },
});
