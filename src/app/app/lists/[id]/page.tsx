"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, ChevronDown, Copy, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { todoLists } from "@/lib/mock";

export default function ListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const seed = todoLists.find((l) => l.id === id);
  const [items, setItems] = useState(seed?.items ?? []);
  const [newText, setNewText] = useState("");
  const [showDone, setShowDone] = useState(true);

  if (!seed) {
    return (
      <Card className="p-12 text-center">
        <p className="font-medium text-navy">List not found</p>
        <Link href="/app/lists" className="mt-2 inline-block text-sm text-indigo-900 hover:underline">
          ← Back to lists
        </Link>
      </Card>
    );
  }

  const open = items.filter((i) => !i.completed);
  const done = items.filter((i) => i.completed);

  const toggle = (itemId: string) =>
    setItems((cur) =>
      cur.map((i) => (i.id === itemId ? { ...i, completed: !i.completed } : i))
    );

  const add = () => {
    const text = newText.trim();
    if (!text) return;
    setItems((cur) => [
      ...cur,
      { id: `itm_${Date.now()}`, text, completed: false, position: cur.length },
    ]);
    setNewText("");
  };

  return (
    <div className="mx-auto max-w-[680px] space-y-5">
      <div>
        <Link
          href="/app/lists"
          className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-navy"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Lists
        </Link>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-[28px] font-semibold tracking-tight text-navy">
            {seed.name}
          </h1>
          <Button variant="secondary" size="sm">
            <Copy className="size-4" aria-hidden />
            Duplicate
          </Button>
        </div>
        <p className="text-sm text-ink-muted">
          {done.length}/{items.length} done
        </p>
      </div>

      {/* Add item */}
      <div className="flex gap-2">
        <input
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add an item…"
          aria-label="Add an item"
          className="h-10 flex-1 rounded-[10px] border border-line bg-white px-3 text-sm text-navy placeholder:text-ink-muted"
        />
        <Button onClick={add}>
          <Plus className="size-4" aria-hidden />
          Add
        </Button>
      </div>

      {/* Open items */}
      <Card className="divide-y divide-line">
        {open.length === 0 ? (
          <p className="p-8 text-center text-sm text-ink-muted">
            Everything&apos;s ticked off 🎉
          </p>
        ) : (
          open.map((i) => (
            <label
              key={i.id}
              className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-soft"
            >
              <input
                type="checkbox"
                checked={false}
                onChange={() => toggle(i.id)}
                className="size-4.5 cursor-pointer accent-indigo-900"
              />
              <span className="text-[15px] text-navy">{i.text}</span>
            </label>
          ))
        )}
      </Card>

      {/* AI suggest */}
      <Button variant="ghost" size="sm">
        <Sparkles className="size-4" aria-hidden />
        Suggest items
      </Button>

      {/* Done section */}
      {done.length > 0 && (
        <section>
          <button
            onClick={() => setShowDone((s) => !s)}
            className="mb-2 flex cursor-pointer items-center gap-1 text-sm font-semibold text-ink-muted hover:text-navy"
            aria-expanded={showDone}
          >
            <ChevronDown
              className={cn("size-4 transition-transform", !showDone && "-rotate-90")}
              aria-hidden
            />
            Done ({done.length})
          </button>
          {showDone && (
            <Card className="divide-y divide-line opacity-70">
              {done.map((i) => (
                <label
                  key={i.id}
                  className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-soft"
                >
                  <input
                    type="checkbox"
                    checked
                    onChange={() => toggle(i.id)}
                    className="size-4.5 cursor-pointer accent-indigo-900"
                  />
                  <span className="text-[15px] text-navy line-through">{i.text}</span>
                </label>
              ))}
            </Card>
          )}
        </section>
      )}
    </div>
  );
}
