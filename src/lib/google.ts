/**
 * Mock of the Google sign-in handoff. The real flow (backend spec: POST
 * /auth/google) redirects to Google's consent screen and returns a verified
 * profile; here we simulate the returned profile and stash it for the
 * complete-profile step, which collects whatever Google didn't provide.
 */

export type GoogleProfile = { name: string; email: string };

const KEY = "amiva_google_pending";

export function startGoogleSignIn(): GoogleProfile {
  const profile: GoogleProfile = { name: "Ada Obi", email: "ada.obi@gmail.com" };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    /* private mode */
  }
  return profile;
}

export function pendingGoogleProfile(): GoogleProfile | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as GoogleProfile) : null;
  } catch {
    return null;
  }
}

export function clearGoogleProfile() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* private mode */
  }
}
