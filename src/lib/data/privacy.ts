/**
 * Privacy & account lifecycle (spec §5.12). Real mode: GET /privacy/overview
 * (per-kind data counts), POST /privacy/export → poll → authed download, and
 * DELETE /account (14-day grace). Mock mode: static counts, simulated export,
 * no-op delete.
 */

import { api, apiBlob, USE_MOCKS } from "@/lib/api/client";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type DataCount = { kind: string; count: number };

const MOCK_COUNTS: DataCount[] = [
  { kind: "memories", count: 7 },
  { kind: "reminders", count: 5 },
  { kind: "tasks", count: 6 },
  { kind: "calendar_events", count: 8 },
];

export async function privacyOverview(): Promise<DataCount[]> {
  if (USE_MOCKS) return delay(300).then(() => MOCK_COUNTS);
  const res = await api<{ data_categories: DataCount[] }>("/privacy/overview");
  return res.data_categories ?? [];
}

/** Starts an export, polls until ready, and hands back the blob to save.
 * The download endpoint is authed, so a plain <a href> can't fetch it. */
export async function runExport(): Promise<Blob> {
  if (USE_MOCKS) {
    await delay(1200);
    return new Blob([JSON.stringify({ mock: true })], { type: "application/json" });
  }
  const { job_id } = await api<{ job_id: string }>("/privacy/export", { method: "POST" });
  for (let i = 0; i < 30; i++) {
    const st = await api<{ status: string; download_url?: string | null }>(
      `/privacy/export/${job_id}`
    );
    if (st.status === "ready" && st.download_url)
      return apiBlob(st.download_url.replace(/^\/api\/v1/, ""));
    await delay(2000);
  }
  throw new Error("Export did not become ready in time");
}

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Returns the hard-delete date (ISO). The server revokes every session. */
export async function deleteAccount(): Promise<string> {
  if (USE_MOCKS) return delay(500).then(() => new Date().toISOString());
  const res = await api<{ status: "scheduled"; hard_delete_after: string }>("/account", {
    method: "DELETE",
  });
  return res.hard_delete_after;
}
