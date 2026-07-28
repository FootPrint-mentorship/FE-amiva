"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Send, AlarmClock, CheckSquare, CalendarDays, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/cn";
import { chatSeed, fmtTime, type ChatMessage } from "@/lib/mock";

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
  "Summarise my unread email",
  "Find my landlord's account number",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(chatSeed);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

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
    // Mock assistant: echoes intent. Replaced by POST /assistant/messages when backend lands.
    setTimeout(() => {
      setMessages((cur) => [
        ...cur,
        {
          id: `msg_${Date.now()}_a`,
          role: "assistant",
          text: "This preview runs on mock data. Once the backend is connected I'll handle that for real. Here's how a confirmation looks:",
          at: new Date().toISOString(),
        },
      ]);
      setTyping(false);
    }, 900);
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-8.5rem)] max-w-[760px] flex-col">
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
                className="mt-1 size-[30px] shrink-0 rounded-full"
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
                <div className="flex items-center gap-3 rounded-[12px] border border-line bg-white px-3.5 py-2.5 shadow-card">
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

              {/* Embedded confirmation */}
              {m.confirmation && (
                <div className="rounded-[12px] border border-warning/50 bg-warning/10 p-3.5">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="mt-0.5 size-4 shrink-0 text-[#9a6a1d]" aria-hidden />
                    <div>
                      <p className="text-sm text-navy">{m.confirmation.summary}</p>
                      <Chip tone="warning" className="mt-1.5">
                        Needs your approval
                      </Chip>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm">Approve</Button>
                    <Button size="sm" variant="ghost">
                      Reject
                    </Button>
                  </div>
                </div>
              )}
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
              className="size-[30px] rounded-full"
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
      <div className="flex items-end gap-2 rounded-[16px] border border-line bg-white p-2 shadow-card">
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
