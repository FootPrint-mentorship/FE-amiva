import { QueryClient, useQuery } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";

/**
 * TanStack Query is the server cache (it replaced the custom stores from
 * lib/store.ts for anything the backend owns). One module-level client,
 * passed to useQuery explicitly, so hooks work in the app AND in tests
 * without provider plumbing. Queries fetch from the API, refetch on focus,
 * and mutations write the server's response back into the cache. (Mock mode
 * retired 17 Aug 2026 — tests fake the api() boundary instead.)
 */

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
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
  fetch: () => Promise<T[]>
): { items: T[]; loading: boolean } {
  const { data, isPending } = useQuery(
    { queryKey: key, queryFn: fetch },
    queryClient
  );
  return { items: data ?? [], loading: isPending };
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
