"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Send, AlarmClock, CheckSquare, CalendarDays, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/cn";
import { chatSeed, fmtDay, fmtTime, type ChatMessage } from "@/lib/mock";
import { useStore } from "@/lib/store";
import { confirmationsStore } from "@/lib/stores";
import { toast } from "@/components/ui/toast";
import { USE_MOCKS } from "@/lib/api/client";
import {
  loadChatHistory,
  resolveConfirmationRemote,
  sendAssistantMessage,
  type ActionTaken,
} from "@/lib/data/assistant";

const resourceIcons = {
  reminder: AlarmClock,
  task: CheckSquare,
  event: CalendarDays,
} as const;

const examplePrompts = [
  "What's my day like?",
  "Remind me to call Ada tomorrow at 10",
  "Add milo to my shopping list",
  "When is my flight to Nairobi?",
  "Find my landlord's account number",
];

/** Resource card for the first thing the assistant actually did. */
function actionResource(actions: ActionTaken[]): ChatMessage["resource"] {
  const a = actions[0];
  if (!a) return undefined;
  const kind = a.type.startsWith("reminder")
    ? ("reminder" as const)
    : a.type.startsWith("task")
    ? ("task" as const)
    : a.type.startsWith("calendar")
    ? ("event" as const)
    : null;
  if (!kind) return undefined;
  const r = a.resource;
  // Some actions return only an id (e.g. task.create) — the reply text
  // already says what happened, so a card would just repeat the type.
  if (typeof r.title !== "string") return undefined;
  const when = r.due_at ?? r.start_at ?? r.due_date;
  const meta =
    typeof when === "string"
      ? `${fmtDay(when)} · ${fmtTime(when)}`
      : kind.charAt(0).toUpperCase() + kind.slice(1);
  return { kind, title: r.title, meta };
}

export default function ChatPage() {
  const confirmations = useStore(confirmationsStore);
  const [messages, setMessages] = useState<ChatMessage[]>(USE_MOCKS ? chatSeed : []);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // Real mode: the thread lives on the server (shared with WhatsApp).
  useEffect(() => {
    loadChatHistory()
      .then((history) => {
        if (history) setMessages(history);
      })
      .catch(() => {
        /* empty thread is an honest starting point; sending still works */
      });
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const send = (text?: string) => {
    const body = (text ?? draft).trim();
    if (!body || typing) return;
    setDraft("");
    const now = new Date().toISOString();
    setMessages((cur) => [
      ...cur,
      { id: `msg_${Date.now()}`, role: "user", text: body, at: now },
    ]);
    setTyping(true);
    sendAssistantMessage(body)
      .then((res) => {
        setMessages((cur) => [
          ...cur,
          {
            id: `msg_${Date.now()}_a`,
            role: "assistant",
            text: res.reply,
            resource: actionResource(res.actions_taken),
            confirmation: res.pending_confirmation ?? undefined,
            at: new Date().toISOString(),
          },
        ]);
      })
      .catch(() => {
        setMessages((cur) => [
          ...cur,
          {
            id: `msg_${Date.now()}_e`,
            role: "assistant",
            text: "I couldn't reach the assistant just now — nothing was changed. Please try that again in a moment.",
            at: new Date().toISOString(),
          },
        ]);
      })
      .finally(() => setTyping(false));
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-8.5rem)] max-w-190 flex-col">
      {/* Thread */}
      <div
        className="flex-1 space-y-4 overflow-y-auto pb-4"
        aria-live="polite"
        aria-label="Conversation with Amiva"
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn("flex gap-3", m.role === "user" && "justify-end")}
          >
            {m.role === "assistant" && (
              <Image
                src="/brand/mark.svg"
                alt=""
                width={30}
                height={30}
                className="mt-1 size-7.5 shrink-0 rounded-full"
              />
            )}
            <div className={cn("max-w-[78%] space-y-2", m.role === "user" && "items-end")}>
              <div
                className={cn(
                  "rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed shadow-card",
                  m.role === "user"
                    ? "rounded-tr-sm bg-indigo-900 text-white"
                    : "rounded-tl-sm border border-line bg-white text-navy"
                )}
              >
                {m.text}
                <span
                  className={cn(
                    "mt-1 block text-right text-[10px]",
                    m.role === "user" ? "text-white/50" : "text-ink-muted"
                  )}
                >
                  {fmtTime(m.at)}
                </span>
              </div>

              {/* Embedded resource card */}
              {m.resource && (
                <div className="flex items-center gap-3 rounded-xl border border-line bg-white px-3.5 py-2.5 shadow-card">
                  {(() => {
                    const Icon = resourceIcons[m.resource.kind];
                    return (
                      <span className="flex size-8 items-center justify-center rounded-[10px] bg-indigo-50">
                        <Icon className="size-4 text-indigo-900" aria-hidden />
                      </span>
                    );
                  })()}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-navy">
                      {m.resource.title}
                    </p>
                    <p className="text-xs text-ink-muted">{m.resource.meta}</p>
                  </div>
                </div>
              )}

              {/* Embedded confirmation, live from the shared store */}
              {m.confirmation &&
                (() => {
                  const live = confirmations.find((c) => c.id === m.confirmation!.id);
                  const status = live?.status ?? "pending";
                  return (
                    <div className="rounded-xl border border-warning/50 bg-warning/10 p-3.5">
                      <div className="flex items-start gap-2">
                        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning-ink" aria-hidden />
                        <div>
                          <p className="text-sm text-navy">{m.confirmation.summary}</p>
                          <Chip
                            tone={status === "approved" ? "success" : status === "rejected" ? "neutral" : "warning"}
                            className="mt-1.5"
                          >
                            {status === "approved"
                              ? "Approved"
                              : status === "rejected"
                              ? "Rejected"
                              : "Needs your approval"}
                          </Chip>
                        </div>
                      </div>
                      {status === "pending" && (
                        <div className="mt-3 flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              resolveConfirmationRemote(m.confirmation!.id, "approved")
                                .then((reply) => toast(reply))
                                .catch(() => toast("That didn't go through — nothing was changed.", { tone: "error" }));
                            }}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              resolveConfirmationRemote(m.confirmation!.id, "rejected")
                                .then((reply) => toast(reply, { tone: "info" }))
                                .catch(() => toast("That didn't go through — nothing was changed.", { tone: "error" }));
                            }}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })()}
            </div>
          </div>
        ))}

        {typing && (
          <div className="flex items-center gap-3">
            <Image
              src="/brand/mark.svg"
              alt=""
              width={30}
              height={30}
              className="size-7.5 rounded-full"
            />
            <div className="rounded-2xl rounded-tl-sm border border-line bg-white px-4 py-3 shadow-card">
              <span className="inline-flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="size-1.5 animate-bounce rounded-full bg-violet-300"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Example prompts when thread is short */}
      {messages.length <= 4 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {examplePrompts.map((p) => (
            <button
              key={p}
              onClick={() => send(p)}
              className="cursor-pointer rounded-full border border-line bg-white px-3.5 py-1.5 text-[13px] text-ink-muted transition-colors hover:border-cyan-500 hover:text-navy"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Composer */}
      <div className="flex items-end gap-2 rounded-2xl border border-line bg-white p-2 shadow-card">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          placeholder="Message Amiva…"
          aria-label="Message Amiva"
          className="max-h-32 flex-1 resize-none bg-transparent px-2 py-1.5 text-[15px] text-navy outline-none placeholder:text-ink-muted"
        />
        <Button size="sm" onClick={() => send()} disabled={!draft.trim() || typing} aria-label="Send">
          <Send className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
