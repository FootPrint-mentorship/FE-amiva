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
    features: (u.features as Settings["features"]) ?? c.features,
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
  phone: string; // E.164
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
    body: data,
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
