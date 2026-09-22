/**
 * Integrations (Settings → Integrations). GET /integrations
 * (bare array, like /calendar/events), POST /integrations/google/authorize
 * (redirects the browser to Google), DELETE /integrations/{id}. Without
 * GOOGLE_CLIENT_ID the backend answers PROVIDER_ERROR — surfaced honestly,
 * never faked as connected.
 */

import { api } from "@/lib/api/client";
import { getList, qk, setList, useCollection } from "@/lib/query";
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

const fetchIntegrations = () => api<IntegrationInfo[]>("/integrations");

/** Raw server rows; the settings page reads account emails from here. */
export function useIntegrations() {
  return useCollection<IntegrationInfo>(qk.integrations, fetchIntegrations);
}

type GoogleScope = "calendar";

function active(rows: IntegrationInfo[], scope: GoogleScope): boolean {
  // Contract: status is 'connected' | 'expired' | 'revoked' — checking for a
  // nonexistent 'active' kept the UI stuck on "not connected" forever
  // (found via a user recording, 16 Aug 2026).
  return rows.some((r) => r.status === "connected" && r.scopes.includes(scope));
}

export async function hydrateIntegrations(): Promise<void> {
  const rows = await fetchIntegrations();
  setList(qk.integrations, rows);
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
export async function connectGoogle(
  scope: GoogleScope,
  returnTo: "/app/settings" | "/onboarding" = "/app/settings"
): Promise<void> {
  const res = await api<{ authorization_url: string }>(
    "/integrations/google/authorize",
    { method: "POST", body: { scopes: [scope], return_to: returnTo } }
  );
  window.location.href = res.authorization_url;
}

/** Revoke every active integration covering the scope. */
export async function revokeIntegration(scope: GoogleScope): Promise<void> {
  const rows = getList<IntegrationInfo>(qk.integrations).filter(
    (r) => r.status === "connected" && r.scopes.includes(scope)
  );
  for (const row of rows) {
    await api(`/integrations/${row.id}`, { method: "DELETE" });
  }
  setList(
    qk.integrations,
    getList<IntegrationInfo>(qk.integrations).filter((r) => !rows.includes(r))
  );
  settingsStore.set((c) => ({
    ...c,
    integrations: { ...c.integrations, [scope]: false },
  }));
}
