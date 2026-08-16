import { api, clearTokens, hasSession, setTokens, USE_MOCKS } from "@/lib/api/client";
import { isAuthed, setAuthed } from "@/lib/session";
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
  features?: Record<string, boolean>;
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
    features: (u.features as Settings["features"]) ?? c.features,
    hydrated: true, // server truth is in — badges may now assert state
  }));
}

export function sessionActive(): boolean {
  return USE_MOCKS ? isAuthed() : hasSession();
}

export async function sendEmailCode(email: string): Promise<void> {
  if (USE_MOCKS) return delay(500).then(() => undefined);
  await api("/auth/email/send-code", { method: "POST", body: { email }, auth: false });
}

export async function verifyEmailCode(email: string, code: string): Promise<void> {
  if (USE_MOCKS) return;
  await api("/auth/email/verify", { method: "POST", body: { email, code }, auth: false });
}

export async function register(data: {
  name: string;
  email: string;
  phone?: string; // E.164 — optional (§11.1 as amended 16 Aug 2026)
  password: string;
  timezone: string;
}): Promise<void> {
  if (USE_MOCKS) {
    await delay(600);
    settingsStore.set((c) => ({
      ...c,
      fullName: data.name,
      preferredName: data.name.split(" ")[0],
      timezone: data.timezone,
      emailVerified: true,
      phoneVerified: false,
    }));
    setAuthed(true);
    return;
  }
  const res = await api<TokenResponse>("/auth/register", {
    method: "POST",
    // Omit phone entirely when the user left it empty — an empty string
    // would fail the API's E.164 validation.
    body: { ...data, ...(data.phone ? {} : { phone: undefined }) },
    auth: false,
  });
  setTokens(res.access_token, res.refresh_token);
  absorbUser(res.user);
  setAuthed(true); // guard flag stays the single source for both modes
}

export async function login(identifier: string, password: string): Promise<void> {
  if (USE_MOCKS) {
    await delay(500);
    setAuthed(true);
    return;
  }
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
  if (USE_MOCKS) {
    settingsStore.set((c) => ({
      ...c,
      preferredName: data.preferredName ?? c.preferredName,
      phone: data.phone ?? c.phone,
      timezone: data.timezone ?? c.timezone,
      emailVerified: true,
    }));
    setAuthed(true);
    return;
  }
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
  if (!USE_MOCKS) {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      /* the session is being discarded either way */
    }
    clearTokens();
  }
  setAuthed(false);
}

export async function loadMe(): Promise<void> {
  if (USE_MOCKS) return;
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

const MOCK_SESSIONS: SessionRow[] = [
  {
    id: "ses-this", device_label: "MacBook · Lagos", ip: null, user_agent: null,
    current: true, last_used_at: new Date().toISOString(), created_at: new Date().toISOString(),
  },
];

export async function listSessions(): Promise<SessionRow[]> {
  if (USE_MOCKS) return delay(300).then(() => MOCK_SESSIONS);
  const res = await api<{ data: SessionRow[] }>("/auth/sessions");
  return res.data;
}

export async function revokeSession(id: string): Promise<void> {
  if (USE_MOCKS) return delay(300).then(() => undefined);
  await api(`/auth/sessions/${id}`, { method: "DELETE" });
}

/** §11.4 forgot-password flow doubles as authed "change password". */
export async function requestPasswordReset(email: string): Promise<void> {
  if (USE_MOCKS) return delay(400).then(() => undefined);
  await api("/auth/password/forgot", { method: "POST", body: { email }, auth: false });
}
