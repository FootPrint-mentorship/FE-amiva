import { createStore } from "@/lib/store";

/* Server-owned collections (reminders/tasks/memories/events, confirmations,
   notifications) live in the TanStack Query cache — see lib/query.ts and the
   use* hooks in lib/data/. */

/* ---- settings (profile, notification prefs, integrations, theme) ---- */

export type FeatureKey = "chat" | "reminders" | "calendar" | "tasks" | "memories";

export type Settings = {
  fullName: string;
  preferredName: string;
  email: string;
  phone: string;
  timezone: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  /** False for Google-only accounts — no password exists to change/reset. */
  hasPassword: boolean;
  matrix: Record<string, string[]>;
  quietHours: boolean;
  theme: "system" | "light" | "dark";
  integrations: { whatsapp: boolean; calendar: boolean };
  features: Record<FeatureKey, boolean>;
  /** False until /users/me has answered — screens must not assert server
   * state (verified badges, connection status) while this is false. */
  hydrated: boolean;
};

// Starts blank — absorbUser/loadMe fill the profile, and
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
  hasPassword: true, // assume yes until /users/me answers

  matrix: { Reminders: [], Tasks: [], "Daily agenda": [], "Product updates": [] },
  quietHours: false,
  theme: "system",
  integrations: { whatsapp: false, calendar: false },
  features: {
    chat: true,
    reminders: true,
    calendar: true,
    tasks: true,
    memories: true,
  },
  hydrated: false, // real mode: wait for /users/me
};

export const settingsStore = createStore<Settings>(settingsBlank);
