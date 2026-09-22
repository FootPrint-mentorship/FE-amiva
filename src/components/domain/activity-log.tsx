"use client";

import { useMemo, useState } from "react";
import {
  AlarmClock,
  CalendarDays,
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
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/cn";
import { fmtDay, fmtTime } from "@/lib/format";
import { useActivity } from "@/lib/data/activity";

const moduleIcons: Record<string, typeof AlarmClock> = {
  reminders: AlarmClock,
  calendar: CalendarDays,
  memory: Brain,
  tasks: CheckSquare,
  account: UserRound,
};

const riskTone = { low: "neutral", medium: "warning", high: "danger" } as const;

const moduleOptions = ["all", "reminders", "calendar", "memory", "tasks"];
const riskOptions = ["all", "low", "medium", "high"];

/** The audit trail (PRD trust feature), rendered inside Settings → Activity. */
export function ActivityLog() {
  const { items: auditEvents, loading } = useActivity();
  const [moduleFilter, setModuleFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const visible = useMemo(
    () =>
      auditEvents.filter(
        (e) =>
          (moduleFilter === "all" || e.module === moduleFilter) &&
          (riskFilter === "all" || e.risk === riskFilter),
      ),
    [auditEvents, moduleFilter, riskFilter],
  );

  return (
    <div className="max-w-190 space-y-4">
      <p className="text-sm text-ink-muted">
        Everything Amiva has done, and who approved it.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          Module
          <Select
            label="Module filter"
            value={moduleFilter}
            onChange={setModuleFilter}
            options={moduleOptions.map((m) => ({
              value: m,
              label:
                m === "all" ? "All modules" : m[0].toUpperCase() + m.slice(1),
            }))}
            className="w-40"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          Risk
          <Select
            label="Risk filter"
            value={riskFilter}
            onChange={setRiskFilter}
            options={riskOptions.map((r) => ({
              value: r,
              label:
                r === "all" ? "All levels" : r[0].toUpperCase() + r.slice(1),
            }))}
            className="w-36"
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <Card className="p-12 text-center text-sm text-ink-muted">
          {loading ? "Loading your activity…" : "No activity matches these filters."}
        </Card>
      ) : (
        <div className="space-y-2">
          {visible.map((e) => {
            const Icon = moduleIcons[e.module ?? ""] ?? UserRound;
            const isOpen = expanded === e.id;
            return (
              <Card key={e.id} className="px-4 py-3">
                <button
                  className="flex w-full cursor-pointer items-center gap-3 text-left"
                  onClick={() => setExpanded(isOpen ? null : e.id)}
                  aria-expanded={isOpen}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-control bg-indigo-50">
                    <Icon className="size-4.5 text-indigo-900" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-navy">
                      {e.summary}
                    </span>
                    <span className="mt-0.5 flex items-center gap-2 text-xs text-ink-muted">
                      {e.channel === "whatsapp" ? (
                        <MessageCircle
                          className="size-3.5 text-success"
                          aria-label="via WhatsApp"
                        />
                      ) : (
                        <Globe className="size-3.5" aria-label="via web" />
                      )}
                      {fmtDay(e.created_at)} {fmtTime(e.created_at)}
                    </span>
                  </span>
                  <Chip tone={riskTone[e.risk]}>{e.risk}</Chip>
                  {e.result === "success" ? (
                    <Check
                      className="size-4 shrink-0 text-success"
                      aria-label="Succeeded"
                    />
                  ) : (
                    <X
                      className="size-4 shrink-0 text-danger"
                      aria-label="Failed"
                    />
                  )}
                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0 text-ink-muted transition-transform",
                      isOpen && "rotate-180",
                    )}
                    aria-hidden
                  />
                </button>
                {isOpen && (
                  <div className="ml-12 mt-2 rounded-control bg-soft p-3 text-xs text-ink-muted">
                    <p>
                      Action: <code className="text-navy">{e.action}</code>
                    </p>
                    {e.result === "failure" && (
                      <p className="mt-1 text-danger">
                        The provider did not confirm this action, so no change
                        was made. Amiva reported the failure rather than
                        claiming success.
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
