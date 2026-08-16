import { createStore } from "@/lib/store";
import { USE_MOCKS } from "@/lib/api/client";

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
  matrix: Record<string, string[]>;
  quietHours: boolean;
  theme: "system" | "light" | "dark";
  integrations: { whatsapp: boolean; calendar: boolean };
  features: Record<FeatureKey, boolean>;
  /** False until /users/me has answered — screens must not assert server
   * state (verified badges, connection status) while this is false. */
  hydrated: boolean;
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
  integrations: { whatsapp: true, calendar: true },
  features: {
    chat: true,
    reminders: true,
    calendar: true,
    tasks: true,
    memories: true,
  },
  hydrated: true, // mock mode has no endpoint to wait for
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

export const settingsStore = createStore<Settings>(USE_MOCKS ? settingsSeed : settingsBlank);
