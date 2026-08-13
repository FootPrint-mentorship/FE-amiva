import { createStore } from "@/lib/store";
import { USE_MOCKS } from "@/lib/api/client";
import {
  reminders,
  tasks,
  memories,
  weekEvents,
  pendingConfirmations,
  type Reminder,
  type Task,
  type Memory,
  type CalendarEvent,
  type PendingConfirmation,
} from "@/lib/mock";

/* ---- collections (shaped like the API). Mock mode seeds the demo data;
   real mode starts EMPTY and fills from hydration — a fresh account must
   never flash (or keep, on hydration failure) someone else's fake day. ---- */

export const remindersStore = createStore<Reminder[]>(USE_MOCKS ? reminders : []);
export const tasksStore = createStore<Task[]>(USE_MOCKS ? tasks : []);
export const memoriesStore = createStore<Memory[]>(USE_MOCKS ? memories : []);
export const eventsStore = createStore<CalendarEvent[]>(USE_MOCKS ? weekEvents : []);

/* ---- confirmations (shared by top bar, Today, Chat, tray) ---- */

export type Confirmation = PendingConfirmation & {
  status: "pending" | "approved" | "rejected";
};

export const confirmationsStore = createStore<Confirmation[]>(
  USE_MOCKS ? pendingConfirmations.map((c) => ({ ...c, status: "pending" as const })) : []
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

export const notificationsStore = createStore<AppNotification[]>(USE_MOCKS ? notifSeed : []);

/* ---- settings (profile, notification prefs, integrations, theme) ---- */

export type FeatureKey = "chat" | "reminders" | "calendar" | "tasks" | "memories" | "email";

export type Settings = {
  fullName: string;
  preferredName: string;
  email: string;
  phone: string;
  timezone: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  matrix: Record<string, string[]>;
  quietHours: boolean;
  theme: "system" | "light" | "dark";
  integrations: { whatsapp: boolean; calendar: boolean; gmail: boolean };
  features: Record<FeatureKey, boolean>;
};

const settingsSeed: Settings = {
  fullName: "Ada Obi",
  preferredName: "Ada",
  email: "ada@example.com",
  phone: "+234 801 234 5678",
  timezone: "Africa/Lagos",
  emailVerified: true,
  phoneVerified: true,
  matrix: {
    Reminders: ["WhatsApp", "Email"],
    Tasks: ["WhatsApp"],
    "Daily agenda": ["WhatsApp"],
    "Product updates": ["Email"],
  },
  quietHours: true,
  theme: "system",
  integrations: { whatsapp: true, calendar: true, gmail: false },
  features: {
    chat: true,
    reminders: true,
    calendar: true,
    tasks: true,
    memories: true,
    email: true,
  },
};

// Real mode starts blank — absorbUser/loadMe fill the profile, and
// hydrateNotificationPrefs fills the matrix. The matrix keeps its row keys
// (the settings table indexes them unconditionally); timezone gets the
// browser zone so nothing formats against an empty tz before /users/me lands.
const settingsBlank: Settings = {
  fullName: "",
  preferredName: "",
  email: "",
  phone: "",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  emailVerified: false,
  phoneVerified: false,
  matrix: { Reminders: [], Tasks: [], "Daily agenda": [], "Product updates": [] },
  quietHours: false,
  theme: "system",
  integrations: { whatsapp: false, calendar: false, gmail: false },
  features: {
    chat: true,
    reminders: true,
    calendar: true,
    tasks: true,
    memories: true,
    email: true,
  },
};

export const settingsStore = createStore<Settings>(USE_MOCKS ? settingsSeed : settingsBlank);
