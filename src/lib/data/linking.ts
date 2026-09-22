/**
 * WhatsApp linking — the deep-link flow (backend spec §3.1.3).
 *
 * Amiva's WhatsApp message carries a signed token that identifies the
 * SENDER's chat by hash only — the number itself never reaches the browser.
 * Binding requires a signed-in user (POST /link/whatsapp/verify is authed),
 * so when a visitor lands on /link without a session the token waits in
 * localStorage and the app layout completes the link right after they sign
 * in or register.
 */

import { api } from "@/lib/api/client";
import { settingsStore } from "@/lib/stores";

const PENDING_KEY = "amiva_pending_wa_link";

export function stashPendingLink(token: string): void {
  try {
    window.localStorage.setItem(PENDING_KEY, token);
  } catch {
    /* private mode — the user can re-tap the WhatsApp link after signing in */
  }
}

export function pendingLink(): string | null {
  try {
    return window.localStorage.getItem(PENDING_KEY);
  } catch {
    return null;
  }
}

export function clearPendingLink(): void {
  try {
    window.localStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Web-initiated linking (backend spec §3.2): the server mints a short
 * single-use code plus a wa.me deep link with the code prefilled. The user
 * sends that message to Amiva on WhatsApp; the bot binds the JID it arrives
 * from. The browser then just polls /users/me until whatsapp_linked flips —
 * a verified phone is NOT required (§11.5: a bound wa_id IS the verified
 * WhatsApp channel).
 */
export type LinkCode = {
  code: string;
  wa_deep_link: string;
  expires_at: string;
};

export async function createLinkCode(): Promise<LinkCode> {
  return api<LinkCode>("/link/whatsapp/code", { method: "POST" });
}

/** Server-side unlink (DELETE /link/whatsapp) — the bot stops recognising
 * the number immediately. The store only flips after the server confirms. */
export async function unlinkWhatsApp(): Promise<void> {
  await api("/link/whatsapp", { method: "DELETE" });
  settingsStore.set((c) => ({
    ...c,
    integrations: { ...c.integrations, whatsapp: false },
  }));
}

/** Bind the token's WhatsApp number to the signed-in account. */
export async function verifyWhatsAppLink(token: string): Promise<void> {
  await api("/link/whatsapp/verify", { method: "POST", body: { token } });
  settingsStore.set((c) => ({
    ...c,
    integrations: { ...c.integrations, whatsapp: true },
  }));
  clearPendingLink();
}

/**
 * Complete a link that was waiting for authentication. Returns true when a
 * pending token was found and bound. An invalid/expired token is dropped
 * (the user just asks Amiva for a fresh link) — never retried in a loop.
 */
export async function completePendingLink(): Promise<boolean> {
  const token = pendingLink();
  if (!token) return false;
  try {
    await verifyWhatsAppLink(token);
    return true;
  } catch {
    clearPendingLink();
    return false;
  }
}
