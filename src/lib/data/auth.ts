import { api, clearTokens, hasSession, setTokens } from "@/lib/api/client";
import { setAuthed } from "@/lib/session";
import { settingsStore } from "@/lib/stores";
import type { Settings } from "@/lib/stores";

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: ApiUser;
};

type ApiUser = {
  id: string;
  email: string;
  phone: string | null;
  name: string;
  preferred_name: string | null;
  timezone: string;
  email_verified?: boolean;
  phone_verified?: boolean;
  whatsapp_linked?: boolean;
  profile_complete: boolean;
  has_password?: boolean;
  features?: Record<string, boolean>;
};

/** Push the freshly authenticated user into the settings store. */
function absorbUser(u: ApiUser) {
  settingsStore.set((c) => ({
    ...c,
    fullName: u.name,
    preferredName: u.preferred_name ?? u.name.split(" ")[0],
    email: u.email,
    phone: u.phone ?? "",
    timezone: u.timezone,
    emailVerified: u.email_verified ?? true,
    phoneVerified: u.phone_verified ?? false,
    integrations: {
      ...c.integrations,
      whatsapp: u.whatsapp_linked ?? c.integrations.whatsapp,
    },
    hasPassword: u.has_password ?? true,
    features: (u.features as Settings["features"]) ?? c.features,
    hydrated: true, // server truth is in — badges may now assert state
  }));
}

export function sessionActive(): boolean {
  return hasSession();
}

export async function sendEmailCode(email: string): Promise<void> {
  await api("/auth/email/send-code", { method: "POST", body: { email }, auth: false });
}

export async function verifyEmailCode(email: string, code: string): Promise<void> {
  await api("/auth/email/verify", { method: "POST", body: { email, code }, auth: false });
}

export async function register(data: {
  name: string;
  email: string;
  phone?: string; // E.164 — optional (§11.1 as amended 16 Aug 2026)
  password: string;
  timezone: string;
}): Promise<void> {
  const res = await api<TokenResponse>("/auth/register", {
    method: "POST",
    // Omit phone entirely when the user left it empty — an empty string
    // would fail the API's E.164 validation.
    body: { ...data, ...(data.phone ? {} : { phone: undefined }) },
    auth: false,
  });
  setTokens(res.access_token, res.refresh_token);
  absorbUser(res.user);
  setAuthed(true); // guard flag stays the single source for the route guard
}

export async function login(identifier: string, password: string): Promise<void> {
  const res = await api<TokenResponse>("/auth/login", {
    method: "POST",
    body: { identifier, password },
    auth: false,
  });
  setTokens(res.access_token, res.refresh_token);
  absorbUser(res.user);
  setAuthed(true);
}

/** §11 Google sign-in: exchange the OAuth code (from /google-callback) for a
 * session. Returns whether the profile still needs completing. */
export async function googleSignIn(
  code: string,
  redirectUri: string
): Promise<{ profileComplete: boolean }> {
  const res = await api<TokenResponse & { profile_complete: boolean }>("/auth/google", {
    method: "POST",
    body: { code, redirect_uri: redirectUri },
    auth: false,
  });
  setTokens(res.access_token, res.refresh_token);
  absorbUser(res.user);
  setAuthed(true);
  return { profileComplete: res.profile_complete };
}

/** §11.1 as amended: everything optional — phone only if the user wants
 * WhatsApp features (they can add it later in Settings). */
export async function completeProfile(data: {
  phone: string | null;
  preferredName: string | null;
  timezone: string | null;
}): Promise<void> {
  const user = await api<ApiUser>("/auth/complete-profile", {
    method: "POST",
    body: {
      phone: data.phone,
      preferred_name: data.preferredName,
      timezone: data.timezone,
    },
  });
  absorbUser(user);
  setAuthed(true);
}

export async function signOut(): Promise<void> {
  try {
    await api("/auth/logout", { method: "POST" });
  } catch {
    /* the session is being discarded either way */
  }
  clearTokens();
  setAuthed(false);
}

export async function loadMe(): Promise<void> {
  absorbUser(await api<ApiUser>("/users/me"));
}

// --- Active sessions (spec §3: list + remote revoke) -------------------------

export type SessionRow = {
  id: string;
  device_label: string | null;
  ip: string | null;
  user_agent: string | null;
  current: boolean;
  last_used_at: string | null;
  created_at: string;
};

export async function listSessions(): Promise<SessionRow[]> {
  const res = await api<{ data: SessionRow[] }>("/auth/sessions");
  return res.data;
}

export async function revokeSession(id: string): Promise<void> {
  await api(`/auth/sessions/${id}`, { method: "DELETE" });
}

/** §11.4 forgot-password flow doubles as authed "change password". */
export async function requestPasswordReset(email: string): Promise<void> {
  await api("/auth/password/forgot", { method: "POST", body: { email }, auth: false });
}

/** §11.4 step 2: the emailed link carries the token; a successful reset
 * revokes every existing session family server-side. */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await api("/auth/password/reset", {
    method: "POST",
    body: { token, new_password: newPassword },
    auth: false,
  });
}
