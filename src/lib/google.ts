/**
 * Google sign-in handoff (backend spec §11: POST /auth/google).
 *
 * Redirects the browser to Google's OAuth consent screen with the identity
 * scopes; Google bounces back to /google-callback?code=…, which exchanges
 * the code via the API and lands in the app. Requires
 * NEXT_PUBLIC_GOOGLE_CLIENT_ID — without it, startGoogleSignIn throws an
 * honest configuration error instead of faking a sign-in.
 */

export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export type GoogleProfile = { name: string; email: string };

const KEY = "amiva_google_pending";

export function googleRedirectUri(): string {
  return `${window.location.origin}/google-callback`;
}

/** Always true: the browser is navigating to Google. Throws when the client
 * id is missing — a configuration error the caller should surface. */
export function startGoogleSignIn(): boolean {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error("Google sign-in is not configured (NEXT_PUBLIC_GOOGLE_CLIENT_ID)");
  }
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", GOOGLE_CLIENT_ID);
  url.searchParams.set("redirect_uri", googleRedirectUri());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("prompt", "select_account");
  window.location.href = url.toString();
  return true;
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
