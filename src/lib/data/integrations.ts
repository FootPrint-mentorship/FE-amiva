/**
 * Integrations (Settings → Integrations). Real mode: GET /integrations
 * (bare array, like /calendar/events), POST /integrations/google/authorize
 * (redirects the browser to Google), DELETE /integrations/{id}. Without
 * GOOGLE_CLIENT_ID the backend answers PROVIDER_ERROR — surfaced honestly,
 * never faked as connected. Mock mode keeps the local toggle demo.
 */

import { api, USE_MOCKS } from "@/lib/api/client";
import { createStore } from "@/lib/store";
import { settingsStore } from "@/lib/stores";

export type IntegrationInfo = {
  id: string;
  provider: string;
  account_email: string;
  scopes: string[];
  status: string;
  connected_at: string;
  features: Record<string, boolean>;
};

/** Raw server rows; the settings page reads account emails from here. */
export const integrationsStore = createStore<IntegrationInfo[]>([]);

type GoogleScope = "calendar";

function active(rows: IntegrationInfo[], scope: GoogleScope): boolean {
  return rows.some((r) => r.status === "active" && r.scopes.includes(scope));
}

export async function hydrateIntegrations(): Promise<void> {
  if (USE_MOCKS) return;
  const rows = await api<IntegrationInfo[]>("/integrations");
  integrationsStore.set(rows);
  settingsStore.set((c) => ({
    ...c,
    integrations: {
      ...c.integrations,
      calendar: active(rows, "calendar"),
    },
  }));
}

/**
 * Start the Google OAuth dance for one scope. Resolves after navigation
 * starts; rejects with the server's error (e.g. OAuth not configured).
 */
export async function connectGoogle(scope: GoogleScope): Promise<void> {
  if (USE_MOCKS) {
    settingsStore.set((c) => ({
      ...c,
      integrations: { ...c.integrations, [scope]: true },
    }));
    return;
  }
  const res = await api<{ authorization_url: string }>(
    "/integrations/google/authorize",
    { method: "POST", body: { scopes: [scope] } }
  );
  window.location.href = res.authorization_url;
}

/** Revoke every active integration covering the scope. */
export async function revokeIntegration(scope: GoogleScope): Promise<void> {
  if (!USE_MOCKS) {
    const rows = integrationsStore
      .get()
      .filter((r) => r.status === "active" && r.scopes.includes(scope));
    for (const row of rows) {
      await api(`/integrations/${row.id}`, { method: "DELETE" });
    }
    integrationsStore.set((cur) => cur.filter((r) => !rows.includes(r)));
  }
  settingsStore.set((c) => ({
    ...c,
    integrations: { ...c.integrations, [scope]: false },
  }));
}
