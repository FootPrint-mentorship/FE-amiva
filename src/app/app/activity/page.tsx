"use client";

import { useMemo, useState } from "react";
import {
  AlarmClock,
  CalendarDays,
  Mail,
  Brain,
  CheckSquare,
  UserRound,
  MessageCircle,
  Globe,
  Check,
  X,
  ChevronDown,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/cn";
import { auditEvents, fmtDay, fmtTime } from "@/lib/mock";

const moduleIcons = {
  reminders: AlarmClock,
  calendar: CalendarDays,
  email: Mail,
  memory: Brain,
  tasks: CheckSquare,
  account: UserRound,
} as const;

const riskTone = { low: "neutral", medium: "warning", high: "danger" } as const;

const moduleOptions = ["all", "reminders", "calendar", "email", "memory", "tasks"] as const;
const riskOptions = ["all", "low", "medium", "high"] as const;

export default function ActivityPage() {
  const [moduleFilter, setModuleFilter] = useState<(typeof moduleOptions)[number]>("all");
  const [riskFilter, setRiskFilter] = useState<(typeof riskOptions)[number]>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const visible = useMemo(
    () =>
      auditEvents.filter(
        (e) =>
          (moduleFilter === "all" || e.module === moduleFilter) &&
          (riskFilter === "all" || e.risk === riskFilter)
      ),
    [moduleFilter, riskFilter]
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight text-navy">Activity</h1>
        <p className="text-sm text-ink-muted">
          Everything Amiva has done, and who approved it.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          Module
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value as typeof moduleFilter)}
            className="h-9 rounded-[10px] border border-line bg-white px-2.5 text-sm capitalize text-navy"
          >
            {moduleOptions.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          Risk
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value as typeof riskFilter)}
            className="h-9 rounded-[10px] border border-line bg-white px-2.5 text-sm capitalize text-navy"
          >
            {riskOptions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Timeline */}
      {visible.length === 0 ? (
        <Card className="p-12 text-center text-sm text-ink-muted">
          No activity matches these filters.
        </Card>
      ) : (
        <div className="space-y-2">
          {visible.map((e) => {
            const Icon = moduleIcons[e.module];
            const isOpen = expanded === e.id;
            return (
              <Card key={e.id} className="px-4 py-3">
                <button
                  className="flex w-full cursor-pointer items-center gap-3 text-left"
                  onClick={() => setExpanded(isOpen ? null : e.id)}
                  aria-expanded={isOpen}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-indigo-50">
                    <Icon className="size-4.5 text-indigo-900" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-navy">
                      {e.summary}
                    </span>
                    <span className="mt-0.5 flex items-center gap-2 text-xs text-ink-muted">
                      {e.channel === "whatsapp" ? (
                        <MessageCircle className="size-3.5 text-success" aria-label="via WhatsApp" />
                      ) : (
                        <Globe className="size-3.5" aria-label="via web" />
                      )}
                      {fmtDay(e.created_at)} {fmtTime(e.created_at)}
                    </span>
                  </span>
                  <Chip tone={riskTone[e.risk]}>{e.risk}</Chip>
                  {e.result === "success" ? (
                    <Check className="size-4 shrink-0 text-success" aria-label="Succeeded" />
                  ) : (
                    <X className="size-4 shrink-0 text-danger" aria-label="Failed" />
                  )}
                  <ChevronDown
                    className={cn("size-4 shrink-0 text-ink-muted transition-transform", isOpen && "rotate-180")}
                    aria-hidden
                  />
                </button>
                {isOpen && (
                  <div className="ml-12 mt-2 rounded-[10px] bg-soft p-3 text-xs text-ink-muted">
                    <p>
                      Action: <code className="text-navy">{e.action}</code>
                    </p>
                    {e.approval && <p className="mt-1">✓ {e.approval}</p>}
                    {e.result === "failure" && (
                      <p className="mt-1 text-danger">
                        The provider did not confirm this action — no change was made. Amiva reported the failure rather than claiming success.
                      </p>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
