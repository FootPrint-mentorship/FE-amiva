/**
 * Google sign-in handoff (backend spec §11: POST /auth/google).
 *
 * Real mode: redirect the browser to Google's OAuth consent screen with the
 * identity scopes; Google bounces back to /google-callback?code=…, which
 * exchanges the code via the API and lands in the app. Falls back to the
 * mock handoff (stashed fake profile → complete-profile) when no client id
 * is configured or in mock mode, so local dev keeps working without Google.
 */

import { USE_MOCKS } from "@/lib/api/client";

export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export type GoogleProfile = { name: string; email: string };

const KEY = "amiva_google_pending";

export function googleRedirectUri(): string {
  return `${window.location.origin}/google-callback`;
}

/** True = the browser is navigating to Google (real flow); false = handled
 * locally with the mock profile — the caller continues its mock routing. */
export function startGoogleSignIn(): boolean {
  if (!USE_MOCKS && GOOGLE_CLIENT_ID) {
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", GOOGLE_CLIENT_ID);
    url.searchParams.set("redirect_uri", googleRedirectUri());
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("prompt", "select_account");
    window.location.href = url.toString();
    return true;
  }
  const profile: GoogleProfile = { name: "Ada Obi", email: "ada.obi@gmail.com" };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    /* private mode */
  }
  return false;
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
