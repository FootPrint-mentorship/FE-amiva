/**
 * Settings persistence. Real mode: PATCH /users/me (profile),
 * PATCH /users/me/features (partial flag merge), GET/PUT
 * /users/me/preferences/notifications, and the /auth/phone/* verify flow.
 * Mock mode: the stores already hold the state; calls resolve immediately.
 */

import { api, USE_MOCKS } from "@/lib/api/client";
import { settingsStore, type FeatureKey } from "@/lib/stores";

/* Display labels (UI) ↔ API keys (contract). */
const ROW_API: Record<string, string> = {
  Reminders: "reminders",
  Tasks: "tasks",
  "Daily agenda": "agenda",
  "Product updates": "product",
};
const ROW_LABEL = Object.fromEntries(
  Object.entries(ROW_API).map(([label, key]) => [key, label])
);
const CHANNEL_API: Record<string, string> = {
  WhatsApp: "whatsapp",
  Email: "email",
  Push: "push",
};
const CHANNEL_LABEL = Object.fromEntries(
  Object.entries(CHANNEL_API).map(([label, key]) => [key, label])
);

type ApiPrefs = {
  matrix: Record<string, string[]>;
  quiet_hours: { start: string; end: string; timezone: string; urgent_override?: boolean } | null;
  daily_agenda_enabled?: boolean;
  daily_agenda_time?: string | null;
};

export async function saveProfile(): Promise<void> {
  if (USE_MOCKS) return;
  const s = settingsStore.get();
  await api("/users/me", {
    method: "PATCH",
    body: {
      name: s.fullName,
      preferred_name: s.preferredName,
      timezone: s.timezone,
    },
  });
}

/** Persist one feature flag (partial merge server-side). */
export async function saveFeature(key: FeatureKey, on: boolean): Promise<void> {
  if (USE_MOCKS) return;
  await api("/users/me/features", { method: "PATCH", body: { [key]: on } });
}

export async function hydrateNotificationPrefs(): Promise<void> {
  if (USE_MOCKS) return;
  const prefs = await api<ApiPrefs>("/users/me/preferences/notifications");
  settingsStore.set((c) => ({
    ...c,
    matrix: Object.fromEntries(
      Object.entries(prefs.matrix).map(([row, channels]) => [
        ROW_LABEL[row] ?? row,
        channels.map((ch) => CHANNEL_LABEL[ch] ?? ch),
      ])
    ),
    quietHours: prefs.quiet_hours !== null,
  }));
}

export async function saveNotificationPrefs(): Promise<void> {
  if (USE_MOCKS) return;
  const s = settingsStore.get();
  await api("/users/me/preferences/notifications", {
    method: "PUT",
    body: {
      matrix: Object.fromEntries(
        Object.entries(s.matrix).map(([row, channels]) => [
          ROW_API[row] ?? row,
          channels
            .map((ch) => CHANNEL_API[ch] ?? ch)
            .filter((ch) => ch !== "push"), // mobile app is Release 2
        ])
      ),
      // The UI copy promises 22:00–07:00 with urgent override.
      quiet_hours: s.quietHours
        ? { start: "22:00", end: "07:00", timezone: s.timezone, urgent_override: true }
        : null,
    },
  });
}

/* ---- phone verification (Settings → Profile, onboarding step 3) ---- */

export async function sendPhoneCode(): Promise<void> {
  if (USE_MOCKS) return;
  await api("/auth/phone/send-code", { method: "POST", body: {} });
}

export async function verifyPhoneCode(code: string): Promise<void> {
  if (!USE_MOCKS) {
    await api("/auth/phone/verify", { method: "POST", body: { code } });
  }
  settingsStore.set((c) => ({ ...c, phoneVerified: true }));
}
