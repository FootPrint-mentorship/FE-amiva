import { QueryClient, useQuery } from "@tanstack/react-query";
import { ApiError, USE_MOCKS } from "@/lib/api/client";

/**
 * TanStack Query is the server cache (it replaced the custom stores from
 * lib/store.ts for anything the backend owns). One module-level client,
 * passed to useQuery explicitly, so hooks work in the app AND in tests
 * without provider plumbing.
 *
 * Mock mode (NEXT_PUBLIC_USE_MOCKS=1): every collection query seeds its
 * cache from mock.ts via initialData and never refetches (staleTime
 * Infinity) — mutations edit the cache directly, exactly like the old
 * stores. Real mode: queries fetch from the API, refetch on focus, and
 * mutations write the server's response back into the cache.
 */

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Mock data never goes stale; real data refreshes in the background.
      staleTime: USE_MOCKS ? Infinity : 30_000,
      // Mock edits must survive the whole session (the old stores did).
      gcTime: USE_MOCKS ? Infinity : 5 * 60_000,
      retry: (failureCount, error) => {
        // 4xx won't heal by retrying (401 already refresh-retries in api()).
        if (error instanceof ApiError && error.status < 500) return false;
        return failureCount < 2;
      },
    },
  },
});

/** Query keys, one place. */
export const qk = {
  reminders: ["reminders"],
  tasks: ["tasks"],
  memories: ["memories"],
  events: ["events"],
  confirmations: ["confirmations"],
  notifications: ["notifications"],
  settings: ["settings"],
  integrations: ["integrations"],
} as const;

type Key = readonly unknown[];

/**
 * Shared shape for the collection hooks (useReminders, useTasks, …).
 * Returns the cached list (empty while real mode loads) plus a loading flag
 * so screens can tell "still fetching" from "genuinely empty".
 */
export function useCollection<T>(
  key: Key,
  fetchReal: () => Promise<T[]>,
  mockSeed: () => T[]
): { items: T[]; loading: boolean } {
  const { data, isPending } = useQuery(
    {
      queryKey: key,
      queryFn: USE_MOCKS
        ? // A mock "refetch" must return what's in the cache (the user's
          // edits), never re-seed — the seed applies only via initialData.
          async () => queryClient.getQueryData<T[]>(key) ?? mockSeed()
        : fetchReal,
      ...(USE_MOCKS ? { initialData: mockSeed } : {}),
    },
    queryClient
  );
  return { items: data ?? [], loading: !USE_MOCKS && isPending };
}

/* ------------------- cache edit helpers (list caches) ------------------- */

export function setList<T>(key: Key, items: T[]) {
  queryClient.setQueryData<T[]>(key, items);
}

export function getList<T>(key: Key): T[] {
  return queryClient.getQueryData<T[]>(key) ?? [];
}

/** Insert or replace by id. New items go first unless `append`. */
export function upsertInList<T extends { id: string }>(
  key: Key,
  item: T,
  opts?: { append?: boolean }
) {
  queryClient.setQueryData<T[]>(key, (cur = []) =>
    cur.some((x) => x.id === item.id)
      ? cur.map((x) => (x.id === item.id ? item : x))
      : opts?.append
        ? [...cur, item]
        : [item, ...cur]
  );
}

export function patchInList<T extends { id: string }>(
  key: Key,
  id: string,
  changes: Partial<T> | ((cur: T) => T)
) {
  queryClient.setQueryData<T[]>(key, (cur = []) =>
    cur.map((x) =>
      x.id === id
        ? typeof changes === "function"
          ? changes(x)
          : { ...x, ...changes }
        : x
    )
  );
}

export function removeFromList<T extends { id: string }>(key: Key, id: string) {
  queryClient.setQueryData<T[]>(key, (cur = []) => cur.filter((x) => x.id !== id));
}
