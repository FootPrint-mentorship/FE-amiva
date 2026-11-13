"use client";

import { useSyncExternalStore } from "react";
import { detectTimezone } from "@/lib/timezones";

const subscribe = () => () => {};
const serverSnapshot = () => null;

/**
 * The visitor's IANA timezone, safe to render during hydration.
 *
 * Calling detectTimezone() straight into useState runs on the server too,
 * where the zone is the host's (UTC on Netlify), not the visitor's. The
 * server HTML then disagrees with the first browser render and React raises
 * a hydration error (Sentry, /register, Nov 2026). This returns null on the
 * server and during hydration, then the real zone right after.
 */
export function useDetectedTimezone(): string | null {
  return useSyncExternalStore(subscribe, detectTimezone, serverSnapshot);
}
