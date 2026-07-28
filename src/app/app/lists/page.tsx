"use client";

import Link from "next/link";
import { ShoppingCart, Luggage, BookOpen, Clapperboard, Lightbulb, ListChecks, Plus, LayoutTemplate } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { todoLists, fmtDay, type TodoList } from "@/lib/mock";

const listIcons = {
  shopping: ShoppingCart,
  packing: Luggage,
  reading: BookOpen,
  watch: Clapperboard,
  ideas: Lightbulb,
  custom: ListChecks,
} as const;

function ListCard({ list }: { list: TodoList }) {
  const Icon = listIcons[list.type];
  const done = list.items.filter((i) => i.completed).length;
  return (
    <Link href={`/app/lists/${list.id}`}>
      <Card className="h-full p-5 transition-colors hover:border-indigo-300">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-[12px] bg-indigo-50">
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
  const active = todoLists.filter((l) => !l.is_template && !l.archived);
  const templates = todoLists.filter((l) => l.is_template);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-navy">Lists</h1>
          <p className="text-sm text-ink-muted">
            Shopping, packing, ideas. Update them from WhatsApp or right here.
          </p>
        </div>
        <Button>
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
    </div>
  );
}
