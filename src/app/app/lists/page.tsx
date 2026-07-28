"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, Luggage, BookOpen, Clapperboard, Lightbulb, ListChecks, Plus, LayoutTemplate, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { useStore } from "@/lib/store";
import { listsStore } from "@/lib/stores";
import { fmtDay, type TodoList } from "@/lib/mock";

const listIcons = {
  shopping: ShoppingCart,
  packing: Luggage,
  reading: BookOpen,
  watch: Clapperboard,
  ideas: Lightbulb,
  custom: ListChecks,
} as const;

const listTypes = ["shopping", "packing", "reading", "watch", "ideas", "custom"] as const;

function ListCard({ list }: { list: TodoList }) {
  const Icon = listIcons[list.type];
  const done = list.items.filter((i) => i.completed).length;
  return (
    <Link href={`/app/lists/${list.id}`}>
      <Card className="h-full p-5 transition-colors hover:border-indigo-300">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-50">
            <Icon className="size-5 text-indigo-900" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-navy">{list.name}</p>
            <p className="text-xs text-ink-muted">
              {done}/{list.items.length} done · updated {fmtDay(list.updated_at).toLowerCase()}
            </p>
          </div>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-soft">
          <div
            className="h-full rounded-full bg-cyan-500"
            style={{ width: `${list.items.length ? (done / list.items.length) * 100 : 0}%` }}
          />
        </div>
      </Card>
    </Link>
  );
}

export default function ListsPage() {
  const router = useRouter();
  const lists = useStore(listsStore);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<TodoList["type"]>("custom");
  const [bulk, setBulk] = useState("");

  const active = lists.filter((l) => !l.is_template && !l.archived);
  const templates = lists.filter((l) => l.is_template);

  const createList = () => {
    if (!name.trim()) return;
    const id = `lst_${Date.now()}`;
    listsStore.set((cur) => [
      {
        id,
        name: name.trim(),
        type,
        is_template: false,
        archived: false,
        items: bulk
          .split("\n")
          .map((t) => t.trim())
          .filter(Boolean)
          .map((text, i) => ({ id: `itm_${Date.now()}_${i}`, text, completed: false, position: i })),
        updated_at: new Date().toISOString(),
      },
      ...cur,
    ]);
    setCreating(false);
    setName("");
    setBulk("");
    toast("List created.");
    router.push(`/app/lists/${id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-navy">Lists</h1>
          <p className="text-sm text-ink-muted">
            Shopping, packing, ideas. Update them from WhatsApp or right here.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" aria-hidden />
          New list
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {active.map((l) => (
          <ListCard key={l.id} list={l} />
        ))}
      </div>

      {templates.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-muted">
            <LayoutTemplate className="size-4" aria-hidden />
            Templates
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((l) => (
              <ListCard key={l.id} list={l} />
            ))}
          </div>
        </section>
      )}

      {creating && (
        <Modal label="New list" onClose={() => setCreating(false)} panelClassName="w-full max-w-120">
          <Card className="p-6">
            <button
              aria-label="Close"
              onClick={() => setCreating(false)}
              className="absolute right-4 top-4 flex size-8 cursor-pointer items-center justify-center rounded-lg text-ink-muted hover:bg-indigo-50"
            >
              <X className="size-4" aria-hidden />
            </button>
            <h2 className="text-lg font-semibold text-navy">New list</h2>
            <div className="mt-5 space-y-4">
              <label className="block text-sm font-medium text-navy">
                Name
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Weekend market run"
                  autoFocus
                  className="mt-1.5 h-11 w-full rounded-[10px] border border-line bg-white px-3.5 text-[15px] font-normal text-navy placeholder:text-ink-muted focus:border-indigo-300"
                />
              </label>
              <div>
                <p className="mb-1.5 text-sm font-medium text-navy">Type</p>
                <select
                  aria-label="List type"
                  value={type}
                  onChange={(e) => setType(e.target.value as TodoList["type"])}
                  className="h-11 w-full rounded-[10px] border border-line bg-white px-3 text-[15px] capitalize text-navy"
                >
                  {listTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <label className="block text-sm font-medium text-navy">
                Items <span className="font-normal text-ink-muted">(optional, one per line)</span>
                <textarea
                  value={bulk}
                  onChange={(e) => setBulk(e.target.value)}
                  rows={4}
                  placeholder={"Rice 5kg\nBeans\nPalm oil"}
                  className="mt-1.5 w-full rounded-[10px] border border-line bg-white p-3 text-sm font-normal text-navy placeholder:text-ink-muted focus:border-indigo-300"
                />
              </label>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
                <Button disabled={!name.trim()} onClick={createList}>Create list</Button>
              </div>
            </div>
          </Card>
        </Modal>
      )}
    </div>
  );
}
