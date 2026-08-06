/**
 * API client for the Amiva backend (BE-amiva).
 *
 * Mode switch (review requirement): set NEXT_PUBLIC_USE_MOCKS=1 to run the
 * whole app self-contained on the in-memory mock stores — no backend needed.
 * Otherwise calls go to NEXT_PUBLIC_API_BASE_URL (default: local backend).
 *
 * Tokens: access token in memory, refresh token in localStorage. On a 401
 * the client refreshes once and retries; if the refresh fails the session
 * is cleared and the guard bounces to /login.
 */

export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "1";

const BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

const REFRESH_KEY = "amiva_refresh_token";

let accessToken: string | null = null;

export function setTokens(access: string, refresh: string) {
  accessToken = access;
  try {
    window.localStorage.setItem(REFRESH_KEY, refresh);
  } catch {
    /* private mode: access token alone carries the tab session */
  }
}

export function clearTokens() {
  accessToken = null;
  try {
    window.localStorage.removeItem(REFRESH_KEY);
  } catch {
    /* ignore */
  }
}

export function hasSession(): boolean {
  if (accessToken) return true;
  try {
    return !!window.localStorage.getItem(REFRESH_KEY);
  } catch {
    return false;
  }
}

export class ApiError extends Error {
  code: string;
  status: number;
  details?: Record<string, unknown>;
  constructor(code: string, message: string, status: number, details?: Record<string, unknown>) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

// Single-flight: refresh tokens ROTATE server-side, so two concurrent
// refreshes would reuse a rotated token and revoke the whole session family.
let refreshInFlight: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  refreshInFlight ??= (async () => {
    try {
      let refresh: string | null = null;
      try {
        refresh = window.localStorage.getItem(REFRESH_KEY);
      } catch {
        /* ignore */
      }
      if (!refresh) return false;
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refresh }),
      });
      if (!res.ok) {
        clearTokens();
        return false;
      }
      const data = await res.json();
      setTokens(data.access_token, data.refresh_token);
      return true;
    } finally {
      setTimeout(() => {
        refreshInFlight = null;
      }, 0);
    }
  })();
  return refreshInFlight;
}

export async function api<T>(
  path: string,
  init?: { method?: string; body?: unknown; auth?: boolean }
): Promise<T> {
  const { method = "GET", body, auth = true } = init ?? {};

  const attempt = async (): Promise<Response> =>
    fetch(`${BASE}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(auth && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  let res = await attempt();
  if (res.status === 401 && auth) {
    if (await refreshSession()) res = await attempt();
  }

  if (!res.ok) {
    let code = "INTERNAL";
    let message = `Request failed (${res.status})`;
    let details: Record<string, unknown> | undefined;
    try {
      const err = (await res.json()).error;
      code = err.code ?? code;
      message = err.message ?? message;
      details = err.details;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(code, message, res.status, details);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** List envelope from spec §2. */
export type Page<T> = { data: T[]; next_cursor: string | null; total_estimate: number };
