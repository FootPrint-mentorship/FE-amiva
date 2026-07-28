"use client";

import { X } from "lucide-react";
import { createStore, useStore } from "@/lib/store";
import { cn } from "@/lib/cn";

type Toast = {
  id: number;
  message: string;
  tone: "success" | "info" | "error";
  action?: { label: string; onClick: () => void };
};

const toastStore = createStore<Toast[]>([]);
let nextId = 1;

const dismiss = (id: number) =>
  toastStore.set((cur) => cur.filter((t) => t.id !== id));

export function toast(
  message: string,
  opts?: { tone?: Toast["tone"]; action?: Toast["action"] }
) {
  const id = nextId++;
  toastStore.set((cur) => [
    ...cur.slice(-2), // keep at most three on screen
    { id, message, tone: opts?.tone ?? "success", action: opts?.action },
  ]);
  setTimeout(() => dismiss(id), 5000);
}

const toneBar = {
  success: "bg-success",
  info: "bg-cyan-500",
  error: "bg-danger",
} as const;

export function Toaster() {
  const toasts = useStore(toastStore);
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-center gap-3 overflow-hidden rounded-xl border border-line bg-white pr-2 shadow-pop"
        >
          <span className={cn("h-full w-1 self-stretch", toneBar[t.tone])} aria-hidden />
          <p className="flex-1 py-3 text-sm text-navy">{t.message}</p>
          {t.action && (
            <button
              onClick={() => {
                t.action!.onClick();
                dismiss(t.id);
              }}
              className="shrink-0 cursor-pointer rounded-lg px-2 py-1 text-sm font-semibold text-indigo-900 hover:bg-indigo-50"
            >
              {t.action.label}
            </button>
          )}
          <button
            aria-label="Dismiss notification"
            onClick={() => dismiss(t.id)}
            className="shrink-0 cursor-pointer rounded-lg p-1.5 text-ink-muted hover:bg-indigo-50"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </div>
      ))}
    </div>
  );
}
