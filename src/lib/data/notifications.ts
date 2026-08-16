/**
 * Notifications feed (GET /notifications, POST /notifications/read).
 * Mock mode keeps the seeded panel; real mode replaces it with the server
 * feed and reports reads back so badges stay honest across devices.
 */

import { api, Page, USE_MOCKS } from "@/lib/api/client";
import { qk, queryClient, setList, useCollection } from "@/lib/query";

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

const fetchNotifications = async () =>
  (await api<Page<ApiNotification>>("/notifications?limit=50")).data.map(
    (n): AppNotification => ({
      id: n.id,
      title: n.title,
      body: n.body ?? "",
      href: kindHref(n.kind),
      read: n.read_at !== null,
      at: n.created_at,
    })
  );

/** The notifications feed (top-bar bell + panel). */
export function useNotifications() {
  return useCollection<AppNotification>(
    qk.notifications,
    fetchNotifications,
    () => notifSeed
  );
}

/** Warm the notifications cache from the server feed (app layout). */
export async function hydrateNotifications(): Promise<void> {
  if (USE_MOCKS) return;
  setList(qk.notifications, await fetchNotifications());
}

/** Mark specific notifications (or all) read, locally and server-side. */
export async function markNotificationsRead(opts: { ids?: string[]; all?: boolean }): Promise<void> {
  queryClient.setQueryData<AppNotification[]>(qk.notifications, (cur = []) =>
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
