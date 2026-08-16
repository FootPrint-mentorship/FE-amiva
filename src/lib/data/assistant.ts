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
  qk,
  useCollection,
  upsertInList,
  patchInList,
  setList,
  getList,
} from "@/lib/query";
import { invalidateCollections } from "@/lib/data/collections";
import { pendingConfirmations, type ChatMessage, type PendingConfirmation } from "@/lib/mock";

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
  return useCollection<Confirmation>(qk.confirmations, fetchConfirmations, () =>
    pendingConfirmations.map((c) => ({ ...c, status: "pending" as const }))
  );
}

/** Warm the confirmations cache with the server's pending set (app layout). */
export async function hydrateConfirmations(): Promise<void> {
  if (USE_MOCKS) return;
  setList(qk.confirmations, await fetchConfirmations());
}

function resolveConfirmation(id: string, status: "approved" | "rejected") {
  patchInList<Confirmation>(qk.confirmations, id, { status });
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
    void invalidateCollections().catch(() => {
      /* see above */
    });
  }
  return res.reply;
}
