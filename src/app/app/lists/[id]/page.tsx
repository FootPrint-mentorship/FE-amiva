"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, ChevronDown, Copy, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/store";
import { newId } from "@/lib/id";
import { listsStore } from "@/lib/stores";
import type { TodoList } from "@/lib/mock";

const suggestionsByType: Record<TodoList["type"], string[]> = {
  shopping: ["Tomatoes", "Onions", "Cooking gas", "Detergent"],
  packing: ["Chargers and power bank", "Toiletries", "Medication", "Travel documents"],
  reading: ["Atomic Habits", "The Lean Startup", "Company of One"],
  watch: ["A documentary for the weekend", "That series everyone mentions"],
  ideas: ["Write it down before it fades", "One improvement for this week"],
  custom: ["First step", "Next step", "Wrap up"],
};

export default function ListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const lists = useStore(listsStore);
  const list = lists.find((l) => l.id === id);
  const [newText, setNewText] = useState("");
  const [showDone, setShowDone] = useState(true);
  const [suggesting, setSuggesting] = useState(false);

  if (!list) {
    return (
      <Card className="p-12 text-center">
        <p className="font-medium text-navy">List not found</p>
        <Link href="/app/lists" className="mt-2 inline-block text-sm text-indigo-900 hover:underline">
          ← Back to lists
        </Link>
      </Card>
    );
  }

  const items = list.items;
  const open = items.filter((i) => !i.completed);
  const done = items.filter((i) => i.completed);

  const patchItems = (next: TodoList["items"]) =>
    listsStore.set((cur) =>
      cur.map((l) =>
        l.id === id ? { ...l, items: next, updated_at: new Date().toISOString() } : l
      )
    );

  const toggle = (itemId: string) =>
    patchItems(items.map((i) => (i.id === itemId ? { ...i, completed: !i.completed } : i)));

  const add = () => {
    const text = newText.trim();
    if (!text) return;
    patchItems([
      ...items,
      { id: newId("itm"), text, completed: false, position: items.length },
    ]);
    setNewText("");
  };

  const duplicate = () => {
    const copyId = newId("lst");
    listsStore.set((cur) => [
      {
        ...list,
        id: copyId,
        name: `${list.name} (copy)`,
        is_template: false,
        items: list.items.map((i, idx) => ({
          ...i,
          id: newId("itm"),
          completed: false,
        })),
        updated_at: new Date().toISOString(),
      },
      ...cur,
    ]);
    toast("List duplicated with items reset.");
    router.push(`/app/lists/${copyId}`);
  };

  const suggest = () => {
    setSuggesting(true);
    setTimeout(() => {
      const fresh = suggestionsByType[list.type]
        .filter((text) => !items.some((i) => i.text.toLowerCase() === text.toLowerCase()))
        .slice(0, 3);
      if (fresh.length === 0) {
        toast("No new suggestions for this list right now.", { tone: "info" });
      } else {
        patchItems([
          ...items,
          ...fresh.map((text, i) => ({
            id: newId("itm"),
            text,
            completed: false,
            position: items.length + i,
          })),
        ]);
        toast(`Added ${fresh.length} suggestions. Remove any you don't need.`);
      }
      setSuggesting(false);
    }, 700);
  };

  return (
    <div className="mx-auto max-w-170 space-y-5">
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
            {list.name}
          </h1>
          <Button variant="secondary" size="sm" onClick={duplicate}>
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
      <Button variant="ghost" size="sm" loading={suggesting} onClick={suggest}>
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
