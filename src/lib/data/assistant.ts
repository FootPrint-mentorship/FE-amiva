/**
 * Assistant + confirmations repository. Real mode talks to the backend's
 * assistant endpoints (rule-based parser in dev — no LLM key needed); mock
 * mode keeps the self-contained canned reply so the demo runs without a
 * backend. Approving a confirmation re-hydrates the collections so the
 * server-made change shows up everywhere (server-authoritative, PRD: no
 * claimed success without tool confirmation).
 */

import { api, Page, USE_MOCKS } from "@/lib/api/client";
import {
  confirmationsStore,
  resolveConfirmation,
  type Confirmation,
} from "@/lib/stores";
import { hydrateAll } from "@/lib/data/collections";
import type { ChatMessage } from "@/lib/mock";

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

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

/** Replace the confirmations store with the server's pending set. */
export async function hydrateConfirmations(): Promise<void> {
  if (USE_MOCKS) return;
  const page = await api<Page<ApiConfirmation>>(
    "/assistant/confirmations?status=pending"
  );
  confirmationsStore.set(page.data.map(toConfirmation));
}

/** Real mode: the server-side thread. Mock mode: null (page keeps its seed). */
export async function loadChatHistory(): Promise<ChatMessage[] | null> {
  if (USE_MOCKS) return null;
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
  if (USE_MOCKS) {
    await delay(900);
    return {
      reply:
        "This preview runs on mock data. Once the backend is connected I'll handle that for real. Here's how a confirmation looks:",
      actions_taken: [],
      pending_confirmation: null,
    };
  }
  const res = await api<AssistantResponse>("/assistant/messages", {
    method: "POST",
    body: { text },
  });
  if (res.pending_confirmation) {
    const cnf = toConfirmation(res.pending_confirmation);
    confirmationsStore.set((cur) =>
      cur.some((c) => c.id === cnf.id) ? cur : [cnf, ...cur]
    );
  }
  if (res.actions_taken.length > 0) {
    void hydrateAll().catch(() => {
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
  if (USE_MOCKS) {
    resolveConfirmation(id, decision);
    return decision === "approved"
      ? "Approved. Amiva is on it."
      : "Rejected. Nothing was changed.";
  }
  const res = await api<{ result: string; resource: unknown; reply: string }>(
    `/assistant/confirmations/${id}/${decision === "approved" ? "approve" : "reject"}`,
    { method: "POST" }
  );
  resolveConfirmation(id, decision);
  if (decision === "approved") {
    void hydrateAll().catch(() => {
      /* see above */
    });
  }
  return res.reply;
}
