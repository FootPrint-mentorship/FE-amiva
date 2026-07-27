"use client";

import { useState } from "react";
import {
  Mail,
  ExternalLink,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
  Send,
  X,
  CalendarPlus,
  CheckSquare,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/cn";
import { emailThreads, fmtDay, fmtTime, type EmailThreadSummary } from "@/lib/mock";

const ranges = ["Today", "Last 24h", "This week"] as const;

const actionChip = {
  reply: { label: "Reply", tone: "indigo" },
  read: { label: "Read", tone: "neutral" },
  schedule: { label: "Schedule", tone: "cyan" },
} as const;

type Draft = { to: string; subject: string; body: string };

export default function EmailPage() {
  const [connected, setConnected] = useState(false);
  const [range, setRange] = useState<(typeof ranges)[number]>("This week");
  const [openThread, setOpenThread] = useState<EmailThreadSummary | null>(null);
  const [instruction, setInstruction] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [confirmingSend, setConfirmingSend] = useState(false);
  const [sent, setSent] = useState(false);

  /* ---- Not-connected state ---- */
  if (!connected) {
    return (
      <div className="mx-auto max-w-[560px] space-y-5 pt-8">
        <Card className="p-8 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-[16px] bg-indigo-50">
            <Mail className="size-7 text-indigo-900" aria-hidden />
          </span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-navy">
            Connect Gmail
          </h1>
          <p className="mx-auto mt-2 max-w-[400px] text-sm leading-relaxed text-ink-muted">
            Get a daily summary of what matters, extract tasks and meetings
            from threads, and reply faster with drafts written in your tone.
          </p>
          <div className="mx-auto mt-5 max-w-[400px] space-y-2 text-left">
            {[
              "Amiva reads only the folders you allow",
              "Nothing is ever sent without your approval",
              "Disconnect any time — access is revoked immediately",
            ].map((t) => (
              <p key={t} className="flex items-start gap-2 text-sm text-navy">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                {t}
              </p>
            ))}
          </div>
          <Button className="mt-6 w-full" size="lg" onClick={() => setConnected(true)}>
            Connect Gmail
          </Button>
          <p className="mt-3 text-xs text-ink-muted">
            Uses Google OAuth — you choose the permissions on Google&apos;s screen.
          </p>
        </Card>
      </div>
    );
  }

  /* ---- Thread view ---- */
  if (openThread) {
    const closeThread = () => {
      setOpenThread(null);
      setDraft(null);
      setInstruction("");
      setConfirmingSend(false);
      setSent(false);
    };

    const makeDraft = () => {
      if (!instruction.trim() || drafting) return;
      setDrafting(true);
      setTimeout(() => {
        setDraft({
          to: openThread.from.email,
          subject: `Re: ${openThread.subject}`,
          body: `Hi ${openThread.from.name.split(" ")[0]},\n\nThanks for this. ${
            instruction.trim().endsWith(".") ? instruction.trim() : instruction.trim() + "."
          }\n\nBest,\nAda`,
        });
        setDrafting(false);
      }, 900);
    };

    return (
      <div className="mx-auto max-w-[720px] space-y-5">
        <button
          onClick={closeThread}
          className="inline-flex cursor-pointer items-center gap-1 text-sm text-ink-muted hover:text-navy"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Email
        </button>

        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-navy">
            {openThread.subject}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {openThread.from.name} &lt;{openThread.from.email}&gt; · {fmtDay(openThread.last_message_at)}{" "}
            {fmtTime(openThread.last_message_at)}
          </p>
        </div>

        {/* AI summary */}
        <Card className="border-cyan-500/30 bg-cyan-500/8 p-4">
          <div className="flex gap-3">
            <Sparkles className="mt-0.5 size-5 shrink-0 text-cyan-600" aria-hidden />
            <div>
              <p className="text-sm leading-relaxed text-navy">{openThread.summary}</p>
              <p className="mt-1 text-xs text-ink-muted">
                Why it matters: {openThread.importance_reason}
              </p>
            </div>
          </div>
        </Card>

        {/* Extracted actions */}
        <Card className="p-4">
          <p className="mb-3 text-sm font-semibold text-navy">Suggested actions</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm">
              <CheckSquare className="size-4" aria-hidden />
              Create task: follow up by Friday
            </Button>
            {openThread.suggested_action === "schedule" && (
              <Button variant="secondary" size="sm">
                <CalendarPlus className="size-4" aria-hidden />
                Schedule call with Amara
              </Button>
            )}
          </div>
          <p className="mt-2 text-xs text-ink-muted">
            Nothing is created until you click — Amiva proposes, you decide.
          </p>
        </Card>

        {/* Draft composer */}
        {sent ? (
          <Card className="border-success/40 bg-success/5 p-5 text-center">
            <p className="font-medium text-success">Reply sent ✓</p>
            <p className="mt-1 text-xs text-ink-muted">
              Logged in your <span className="font-medium">Activity</span> — sent to {draft?.to} with your approval.
            </p>
          </Card>
        ) : draft ? (
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-navy">
                Draft reply <Chip tone="warning" className="ml-1.5">Draft — not sent</Chip>
              </p>
              <button
                aria-label="Discard draft"
                onClick={() => setDraft(null)}
                className="flex size-7 cursor-pointer items-center justify-center rounded-lg text-ink-muted hover:bg-indigo-50"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-ink-muted">
                To: <span className="text-navy">{draft.to}</span>
              </p>
              <p className="text-ink-muted">
                Subject: <span className="text-navy">{draft.subject}</span>
              </p>
              <textarea
                value={draft.body}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                rows={7}
                aria-label="Draft body"
                className="w-full rounded-[10px] border border-line bg-soft p-3 text-sm leading-relaxed text-navy focus:border-indigo-300"
              />
            </div>
            {confirmingSend ? (
              <div className="mt-4 rounded-[12px] border border-warning/50 bg-warning/10 p-4">
                <p className="text-sm font-medium text-navy">
                  Send this reply to <strong>{draft.to}</strong>?
                </p>
                <p className="mt-1 text-xs text-ink-muted">
                  This is the only send button — Amiva never sends without it.
                </p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={() => { setSent(true); setConfirmingSend(false); }}>
                    <Send className="size-4" aria-hidden />
                    Yes, send it
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmingSend(false)}>
                    Not yet
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setDraft(null)}>
                  Discard
                </Button>
                <Button size="sm" onClick={() => setConfirmingSend(true)}>
                  Approve &amp; send
                </Button>
              </div>
            )}
          </Card>
        ) : (
          <Card className="p-5">
            <p className="mb-2 text-sm font-semibold text-navy">Reply with Amiva</p>
            <div className="flex gap-2">
              <input
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && makeDraft()}
                placeholder="Tell Amiva what to say — “accept, but push the deadline to Monday”"
                aria-label="Draft instruction"
                className="h-11 flex-1 rounded-[10px] border border-line bg-white px-3.5 text-sm text-navy placeholder:text-ink-muted focus:border-indigo-300"
              />
              <Button loading={drafting} onClick={makeDraft}>
                <Sparkles className="size-4" aria-hidden />
                Draft
              </Button>
            </div>
          </Card>
        )}
      </div>
    );
  }

  /* ---- Index ---- */
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-navy">Email</h1>
          <p className="text-sm text-ink-muted">
            ada@gmail.com · summaries only — your inbox stays in Gmail
          </p>
        </div>
        <div role="tablist" className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-[12px] bg-indigo-50 p-1">
          {ranges.map((r) => (
            <button
              key={r}
              role="tab"
              aria-selected={range === r}
              onClick={() => setRange(r)}
              className={cn(
                "shrink-0 cursor-pointer rounded-[9px] px-4 py-1.5 text-sm font-medium transition-colors",
                range === r ? "bg-white text-indigo-900 shadow-card" : "text-ink-muted hover:text-navy"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <Card className="border-cyan-500/30 bg-cyan-500/8 p-4">
        <div className="flex gap-3">
          <Sparkles className="mt-0.5 size-5 shrink-0 text-cyan-600" aria-hidden />
          <p className="text-sm leading-relaxed text-navy">
            {`${emailThreads.length} threads`} worth your attention this week — 2 high
            priority. Kemi&apos;s contract renewal has a Friday deadline, and Tunde
            introduced you to an investor who wants a call.
          </p>
        </div>
      </Card>

      <div className="space-y-2">
        {emailThreads.map((t) => (
          <Card
            key={t.id}
            className="flex cursor-pointer items-start gap-4 px-4 py-3.5 transition-colors hover:border-indigo-300"
            onClick={() => setOpenThread(t)}
          >
            <span
              className={cn(
                "mt-1 flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white",
                t.importance === "high" ? "bg-violet-500" : "bg-indigo-300"
              )}
            >
              {t.from.name[0]}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-navy">{t.from.name}</p>
                {t.importance === "high" && (
                  <Chip tone="danger" title={t.importance_reason}>Important</Chip>
                )}
                <Chip tone={actionChip[t.suggested_action].tone}>
                  {actionChip[t.suggested_action].label}
                </Chip>
                <span className="ml-auto shrink-0 text-xs text-ink-muted">
                  {fmtDay(t.last_message_at)}
                </span>
              </div>
              <p className="mt-0.5 truncate text-sm font-medium text-navy">{t.subject}</p>
              <p className="mt-0.5 line-clamp-2 text-sm text-ink-muted">{t.summary}</p>
            </div>
            <a
              href="https://mail.google.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open in Gmail"
              onClick={(e) => e.stopPropagation()}
              className="mt-1 text-ink-muted hover:text-indigo-900"
            >
              <ExternalLink className="size-4" aria-hidden />
            </a>
          </Card>
        ))}
      </div>
    </div>
  );
}
