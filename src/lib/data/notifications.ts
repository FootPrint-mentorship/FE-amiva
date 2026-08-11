/**
 * Notifications feed (GET /notifications, POST /notifications/read).
 * Mock mode keeps the seeded panel; real mode replaces it with the server
 * feed and reports reads back so badges stay honest across devices.
 */

import { api, Page, USE_MOCKS } from "@/lib/api/client";
import { notificationsStore, type AppNotification } from "@/lib/stores";

type ApiNotification = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  resource_ref: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
};

/** Where a notification should take the user, by kind prefix. */
function kindHref(kind: string): string {
  if (kind.startsWith("reminder")) return "/app/reminders";
  if (kind.startsWith("task")) return "/app/tasks";
  if (kind.startsWith("calendar") || kind.startsWith("event")) return "/app/calendar";
  if (kind.startsWith("memory")) return "/app/memories";
  return "/app/today";
}

export async function hydrateNotifications(): Promise<void> {
  if (USE_MOCKS) return;
  const page = await api<Page<ApiNotification>>("/notifications?limit=50");
  notificationsStore.set(
    page.data.map(
      (n): AppNotification => ({
        id: n.id,
        title: n.title,
        body: n.body ?? "",
        href: kindHref(n.kind),
        read: n.read_at !== null,
        at: n.created_at,
      })
    )
  );
}

/** Mark specific notifications (or all) read, locally and server-side. */
export async function markNotificationsRead(opts: { ids?: string[]; all?: boolean }): Promise<void> {
  notificationsStore.set((cur) =>
    cur.map((n) =>
      opts.all || opts.ids?.includes(n.id) ? { ...n, read: true } : n
    )
  );
  if (USE_MOCKS) return;
  await api("/notifications/read", {
    method: "POST",
    body: opts.all ? { all: true } : { ids: opts.ids },
  }).catch(() => {
    /* the local state already reflects the user's intent; the server
       catches up on the next hydration */
  });
}
