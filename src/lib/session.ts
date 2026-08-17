/**
 * Route-guard flag, set by the real auth flows (lib/data/auth.ts) alongside
 * the tokens. The app layout redirects to /login when neither this flag nor
 * a token is present.
 */
const KEY = "amiva_authed";

export function isAuthed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function setAuthed(on: boolean) {
  try {
    if (on) window.localStorage.setItem(KEY, "1");
    else window.localStorage.removeItem(KEY);
  } catch {
    /* private mode: session lasts for the tab only */
  }
}
