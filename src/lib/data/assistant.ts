/**
 * Assistant + confirmations repository over the backend's assistant
 * endpoints. Approving a confirmation re-hydrates the collections so the
 * server-made change shows up everywhere (server-authoritative, PRD: no
 * claimed success without tool confirmation).
 */

import { api, Page } from "@/lib/api/client";
import {
  qk,
  useCollection,
  upsertInList,
  patchInList,
  setList,
  getList,
} from "@/lib/query";
import { invalidateCollections } from "@/lib/data/collections";
import type { ChatMessage, PendingConfirmation } from "@/lib/types";

export type Confirmation = PendingConfirmation & {
  status: "pending" | "approved" | "rejected";
};

export type ActionTaken = { type: string; resource: Record<string, unknown> };

type ApiConfirmation = {
  id: string;
  action_type: string;
  summary: string;
  risk: "medium" | "high";
  channel: string;
  status: string;
  expires_at: string;
  created_at: string;
};

export type AssistantResponse = {
  reply: string;
  actions_taken: ActionTaken[];
  pending_confirmation: ApiConfirmation | null;
};

type ApiChatMessage = {
  id: string;
  role: string;
  direction: string;
  text: string | null;
  intent: string | null;
  created_at: string;
};

function toConfirmation(c: ApiConfirmation): Confirmation {
  return {
    id: c.id,
    action_type: c.action_type,
    summary: c.summary,
    risk: c.risk,
    expires_at: c.expires_at,
    status: "pending",
  };
}

const fetchConfirmations = async () => {
  const pending = (
    await api<Page<ApiConfirmation>>("/assistant/confirmations?status=pending")
  ).data.map(toConfirmation);
  // The endpoint only returns pending items. Keep this session's resolved
  // ones in the cache — Chat's in-thread cards read their status from here,
  // and dropping them on a refetch (e.g. window refocus) would re-arm an
  // already-approved card's buttons.
  const resolved = getList<Confirmation>(qk.confirmations).filter(
    (c) => c.status !== "pending" && !pending.some((p) => p.id === c.id)
  );
  return [...pending, ...resolved];
};

/** Pending confirmations (shared by top bar, Today banner, Chat, tray). */
export function useConfirmations() {
  return useCollection<Confirmation>(qk.confirmations, fetchConfirmations);
}

/** Warm the confirmations cache with the server's pending set (app layout). */
export async function hydrateConfirmations(): Promise<void> {
  setList(qk.confirmations, await fetchConfirmations());
}

function resolveConfirmation(id: string, status: "approved" | "rejected") {
  patchInList<Confirmation>(qk.confirmations, id, { status });
}

/** The server-side chat thread (shared with WhatsApp). */
export async function loadChatHistory(): Promise<ChatMessage[]> {
  const page = await api<Page<ApiChatMessage>>("/assistant/messages?limit=50");
  return page.data
    .filter((m) => m.text)
    .reverse() // API lists newest first; the thread renders oldest first
    .map((m) => ({
      id: m.id,
      role: m.role === "user" ? ("user" as const) : ("assistant" as const),
      text: m.text!,
      at: m.created_at,
    }));
}

export async function sendAssistantMessage(text: string): Promise<AssistantResponse> {
  const res = await api<AssistantResponse>("/assistant/messages", {
    method: "POST",
    body: { text },
  });
  if (res.pending_confirmation) {
    upsertInList(qk.confirmations, toConfirmation(res.pending_confirmation));
  }
  if (res.actions_taken.length > 0) {
    void invalidateCollections().catch(() => {
      /* the reply already reports what happened; lists catch up on next load */
    });
  }
  return res;
}

/**
 * Approve or reject from anywhere (tray, Today banner, Chat).
 * Resolves to Amiva's reply, ready for a toast.
 */
export async function resolveConfirmationRemote(
  id: string,
  decision: "approved" | "rejected"
): Promise<string> {
  const res = await api<{ result: string; resource: unknown; reply: string }>(
    `/assistant/confirmations/${id}/${decision === "approved" ? "approve" : "reject"}`,
    { method: "POST" }
  );
  resolveConfirmation(id, decision);
  if (decision === "approved") {
    void invalidateCollections().catch(() => {
      /* see above */
    });
  }
  return res.reply;
}
