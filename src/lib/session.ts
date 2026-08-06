/**
 * Mock session flag until real auth exists. The app layout redirects to
 * /login when unset; login, registration and WhatsApp-linking set it.
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

const PROFILE_KEY = "amiva_profile_complete";

export function isProfileComplete(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(PROFILE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setProfileComplete(on: boolean) {
  try {
    if (on) window.localStorage.setItem(PROFILE_KEY, "1");
    else window.localStorage.removeItem(PROFILE_KEY);
  } catch {
    /* private mode */
  }
}
