import { useSyncExternalStore } from "react";

/**
 * Minimal shared-state store for CLIENT-owned state only (toasts, the
 * settings/profile singleton with its theme + form state). Module-level, so
 * state survives client-side navigation and multiple components can watch
 * the same data. Server-owned data (reminders, tasks, memories, events,
 * confirmations, notifications, integrations) lives in the TanStack Query
 * cache — see lib/query.ts (migrated 16 Aug 2026).
 */

type Listener = () => void;

const resetFns: Array<() => void> = [];

export type Store<T> = {
  get: () => T;
  set: (next: T | ((cur: T) => T)) => void;
  subscribe: (l: Listener) => () => void;
};

export function createStore<T>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<Listener>();
  const store: Store<T> = {
    get: () => state,
    set: (next) => {
      state = typeof next === "function" ? (next as (cur: T) => T)(state) : next;
      listeners.forEach((l) => l());
    },
    subscribe: (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
  resetFns.push(() => {
    state = initial;
    listeners.forEach((l) => l());
  });
  return store;
}

export function useStore<T>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}

/** Test hook: restore every store to its seed state. */
export function resetAllStores() {
  resetFns.forEach((f) => f());
}
