"use client";

import { useMemo, useState } from "react";
import { Plus, Flag, X, Sparkles, CheckSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { fmtDay, tasks as seed, type Task } from "@/lib/mock";

const tabs = ["Today", "Upcoming", "Overdue", "Completed"] as const;
type Tab = (typeof tabs)[number];

const priorityTone = {
  urgent: "danger",
  high: "warning",
  medium: "violet",
  low: "neutral",
} as const;

function matches(t: Task, tab: Tab) {
  const today = new Date().toISOString().slice(0, 10);
  switch (tab) {
    case "Today":
      return t.status === "open" && t.due_date === today;
    case "Upcoming":
      return t.status === "open" && (!t.due_date || t.due_date > today);
    case "Overdue":
      return t.status === "open" && !!t.due_date && t.due_date < today;
    case "Completed":
      return t.status === "completed";
  }
}

export default function TasksPage() {
  const [tab, setTab] = useState<Tab>("Today");
  const [items, setItems] = useState(seed);
  const [openId, setOpenId] = useState<string | null>(null);
  const [quickTitle, setQuickTitle] = useState("");

  const visible = useMemo(() => items.filter((t) => matches(t, tab)), [items, tab]);
  const open = items.find((t) => t.id === openId) ?? null;

  const complete = (id: string) =>
    setItems((cur) =>
      cur.map((t) => (t.id === id ? { ...t, status: "completed" as const } : t))
    );

  const toggleSubtask = (taskId: string, subId: string) =>
    setItems((cur) =>
      cur.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: t.subtasks.map((s) =>
                s.id === subId ? { ...s, completed: !s.completed } : s
              ),
            }
          : t
      )
    );

  const quickAdd = () => {
    const title = quickTitle.trim();
    if (!title) return;
    setItems((cur) => [
      {
        id: `tsk_${Date.now()}`,
        title,
        due_date: new Date().toISOString().slice(0, 10),
        priority: "medium" as const,
        status: "open" as const,
        project: null,
        subtasks: [],
      },
      ...cur,
    ]);
    setQuickTitle("");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-navy">Tasks</h1>
          <p className="text-sm text-ink-muted">
            Captured from your chats, emails and meetings, organised here.
          </p>
        </div>
      </div>

      {/* Quick add */}
      <div className="flex gap-2">
        <input
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && quickAdd()}
          placeholder="Add a task…"
          aria-label="Add a task"
          className="h-10 flex-1 rounded-[10px] border border-line bg-white px-3 text-sm text-navy placeholder:text-ink-muted"
        />
        <Button onClick={quickAdd}>
          <Plus className="size-4" aria-hidden />
          Add
        </Button>
      </div>

      {/* Tabs */}
      <div role="tablist" className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-[12px] bg-indigo-50 p-1">
        {tabs.map((t) => {
          const count = items.filter((x) => matches(x, t)).length;
          return (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                "flex cursor-pointer items-center gap-1.5 rounded-[9px] px-4 py-1.5 text-sm font-medium transition-colors",
                tab === t
                  ? "bg-white text-indigo-900 shadow-card"
                  : "text-ink-muted hover:text-navy"
              )}
            >
              {t}
              {t === "Overdue" && count > 0 && (
                <span className="rounded-full bg-danger px-1.5 text-[11px] font-semibold text-white">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Rows */}
      {visible.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <CheckSquare className="size-8 text-violet-300" aria-hidden />
          <p className="font-medium text-navy">No tasks here</p>
          <p className="max-w-[320px] text-sm text-ink-muted">
            Nothing in “{tab}”. Add one above, or tell Amiva on WhatsApp.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {visible.map((t) => {
            const done = t.subtasks.filter((s) => s.completed).length;
            return (
              <Card
                key={t.id}
                className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:border-indigo-300"
                onClick={() => setOpenId(t.id)}
              >
                <button
                  aria-label={`Complete ${t.title}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    complete(t.id);
                  }}
                  className={cn(
                    "flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-md border-2",
                    t.status === "completed"
                      ? "border-success bg-success text-white"
                      : "border-indigo-300 hover:border-indigo-900 hover:bg-indigo-50"
                  )}
                >
                  {t.status === "completed" && "✓"}
                </button>
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-[15px] font-medium text-navy",
                    t.status === "completed" && "line-through opacity-60"
                  )}
                >
                  {t.title}
                </span>
                {t.subtasks.length > 0 && (
                  <span className="text-xs tabular-nums text-ink-muted">
                    {done}/{t.subtasks.length}
                  </span>
                )}
                {t.project && <Chip tone="indigo">{t.project}</Chip>}
                {t.due_date && (
                  <Chip
                    tone={
                      t.due_date < new Date().toISOString().slice(0, 10)
                        ? "danger"
                        : "neutral"
                    }
                  >
                    {fmtDay(`${t.due_date}T12:00:00Z`)}
                  </Chip>
                )}
                <Flag
                  className={cn(
                    "size-4 shrink-0",
                    {
                      urgent: "text-danger",
                      high: "text-warning",
                      medium: "text-violet-500",
                      low: "text-ink-muted",
                    }[t.priority]
                  )}
                  aria-label={`Priority: ${t.priority}`}
                />
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail drawer */}
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-label={open.title}>
          <div
            className="absolute inset-0 bg-navy/30"
            onClick={() => setOpenId(null)}
          />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-[480px] flex-col bg-white shadow-pop">
            <div className="flex items-start justify-between gap-4 border-b border-line p-5">
              <div>
                <h2 className="text-lg font-semibold text-navy">{open.title}</h2>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Chip tone={priorityTone[open.priority]}>{open.priority}</Chip>
                  {open.project && <Chip tone="indigo">{open.project}</Chip>}
                  {open.due_date && (
                    <Chip tone="neutral">Due {fmtDay(`${open.due_date}T12:00:00Z`)}</Chip>
                  )}
                </div>
              </div>
              <button
                aria-label="Close"
                onClick={() => setOpenId(null)}
                className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-ink-muted hover:bg-indigo-50"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              <section>
                <h3 className="mb-2 text-sm font-semibold text-ink-muted">Subtasks</h3>
                {open.subtasks.length === 0 ? (
                  <p className="text-sm text-ink-muted">No subtasks yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {open.subtasks.map((s) => (
                      <li key={s.id} className="flex items-center gap-2.5">
                        <button
                          aria-label={`Toggle ${s.title}`}
                          onClick={() => toggleSubtask(open.id, s.id)}
                          className={cn(
                            "flex size-4.5 shrink-0 cursor-pointer items-center justify-center rounded border-2 text-[10px]",
                            s.completed
                              ? "border-success bg-success text-white"
                              : "border-indigo-300 hover:border-indigo-900"
                          )}
                        >
                          {s.completed && "✓"}
                        </button>
                        <span
                          className={cn(
                            "text-sm text-navy",
                            s.completed && "line-through opacity-60"
                          )}
                        >
                          {s.title}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <Button variant="secondary" size="sm" className="mt-3">
                  <Sparkles className="size-4" aria-hidden />
                  Suggest subtasks
                </Button>
              </section>
              <section>
                <h3 className="mb-1 text-sm font-semibold text-ink-muted">Source</h3>
                <p className="text-sm text-navy">Created via WhatsApp · today</p>
              </section>
            </div>
            <div className="border-t border-line p-4">
              <Button
                className="w-full"
                onClick={() => {
                  complete(open.id);
                  setOpenId(null);
                }}
              >
                Mark complete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
