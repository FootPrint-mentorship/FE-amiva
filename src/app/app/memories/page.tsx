"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Star,
  Plus,
  X,
  MessageCircle,
  Globe,
  Download,
  Trash2,
  Brain,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { memories as seed, fmtDay, type Memory } from "@/lib/mock";

const categories = ["all", "personal", "work", "people", "travel", "finance", "ideas", "other"] as const;

const categoryTone = {
  personal: "cyan",
  work: "indigo",
  people: "violet",
  travel: "success",
  finance: "warning",
  ideas: "danger",
  other: "neutral",
} as const;

export default function MemoriesPage() {
  const [items, setItems] = useState(seed);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<(typeof categories)[number]>("all");
  const [favOnly, setFavOnly] = useState(false);
  const [open, setOpen] = useState<Memory | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [creating, setCreating] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<Memory["category"] | "auto">("auto");

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter(
      (m) =>
        !m.archived &&
        (cat === "all" || m.category === cat) &&
        (!favOnly || m.favorite) &&
        (!needle ||
          m.content.toLowerCase().includes(needle) ||
          m.tags.some((t) => t.includes(needle)))
    );
  }, [items, q, cat, favOnly]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.filter((m) => !m.archived).length };
    for (const m of items.filter((m) => !m.archived)) {
      c[m.category] = (c[m.category] ?? 0) + 1;
    }
    return c;
  }, [items]);

  const toggleFav = (id: string) =>
    setItems((cur) => cur.map((m) => (m.id === id ? { ...m, favorite: !m.favorite } : m)));

  const deleteForever = (id: string) => {
    setItems((cur) => cur.filter((m) => m.id !== id));
    setOpen(null);
    setConfirmDelete(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-navy">Memories</h1>
          <p className="text-sm text-ink-muted">
            Everything you&apos;ve asked Amiva to remember. Search it, edit it, delete it.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">
            <Download className="size-4" aria-hidden />
            Export all
          </Button>
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" aria-hidden />
            New memory
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted" aria-hidden />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search your memories…"
          aria-label="Search your memories"
          className="h-11 w-full rounded-[10px] border border-line bg-white pl-10 pr-4 text-[15px] text-navy placeholder:text-ink-muted focus:border-indigo-300"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-1.5">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            aria-pressed={cat === c}
            className={cn(
              "cursor-pointer rounded-full px-3.5 py-1.5 text-[13px] font-medium capitalize transition-colors",
              cat === c
                ? "bg-indigo-900 text-white"
                : "border border-line bg-white text-ink-muted hover:border-indigo-300"
            )}
          >
            {c} {counts[c] ? <span className="opacity-60">({counts[c]})</span> : null}
          </button>
        ))}
        <button
          onClick={() => setFavOnly((f) => !f)}
          aria-pressed={favOnly}
          className={cn(
            "ml-auto flex cursor-pointer items-center gap-1 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors",
            favOnly
              ? "bg-warning/20 text-[#9a6a1d]"
              : "border border-line bg-white text-ink-muted hover:border-indigo-300"
          )}
        >
          <Star className={cn("size-3.5", favOnly && "fill-current")} aria-hidden />
          Favorites
        </button>
      </div>

      {/* Grid */}
      {visible.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <Brain className="size-8 text-violet-300" aria-hidden />
          <p className="font-medium text-navy">
            {q ? "I couldn't find that" : "No memories yet"}
          </p>
          <p className="max-w-[340px] text-sm text-ink-muted">
            {q
              ? `Nothing matches “${q}” in the sources you've allowed. Try different words.`
              : "Tell Amiva “remember that…” on WhatsApp, or add one here."}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((m) => (
            <Card
              key={m.id}
              className="flex cursor-pointer flex-col p-4 transition-colors hover:border-indigo-300"
              onClick={() => setOpen(m)}
            >
              <p className="line-clamp-4 flex-1 text-sm leading-relaxed text-navy">{m.content}</p>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <Chip tone={categoryTone[m.category]} className="capitalize">
                  {m.category}
                </Chip>
                {m.tags.slice(0, 2).map((t) => (
                  <span key={t} className="text-xs text-ink-muted">#{t}</span>
                ))}
                <span className="ml-auto flex items-center gap-1.5 text-xs text-ink-muted">
                  {m.source_channel === "whatsapp" ? (
                    <MessageCircle className="size-3.5 text-success" aria-label="Saved from WhatsApp" />
                  ) : (
                    <Globe className="size-3.5" aria-label="Saved from web" />
                  )}
                  {fmtDay(m.created_at)}
                </span>
                <button
                  aria-label={m.favorite ? "Remove from favorites" : "Add to favorites"}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFav(m.id);
                  }}
                  className="cursor-pointer text-ink-muted hover:text-warning"
                >
                  <Star className={cn("size-4", m.favorite && "fill-warning text-warning")} aria-hidden />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* New memory modal */}
      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-label="New memory">
          <div className="absolute inset-0 bg-navy/30" onClick={() => setCreating(false)} />
          <Card className="relative w-full max-w-[480px] p-6">
            <button
              aria-label="Close"
              onClick={() => setCreating(false)}
              className="absolute right-4 top-4 flex size-8 cursor-pointer items-center justify-center rounded-lg text-ink-muted hover:bg-indigo-50"
            >
              <X className="size-4" aria-hidden />
            </button>
            <h2 className="text-lg font-semibold text-navy">New memory</h2>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={4}
              autoFocus
              placeholder="What should Amiva remember? Try “Generator mechanic: Emeka, 0803 555 1234”"
              aria-label="Memory content"
              className="mt-4 w-full rounded-[10px] border border-line bg-white p-3 text-sm leading-relaxed text-navy placeholder:text-ink-muted focus:border-indigo-300"
            />
            <div className="mt-3">
              <p className="mb-1.5 text-sm font-medium text-navy">Category</p>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as typeof newCategory)}
                className="h-11 w-full rounded-[10px] border border-line bg-white px-3 text-[15px] capitalize text-navy"
              >
                <option value="auto">Let Amiva decide</option>
                {categories.filter((c) => c !== "all").map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
              <Button
                disabled={!newContent.trim()}
                onClick={() => {
                  setItems((cur) => [
                    {
                      id: `mem_${Date.now()}`,
                      content: newContent.trim(),
                      category: newCategory === "auto" ? "other" : newCategory,
                      tags: [],
                      source_channel: "web",
                      favorite: false,
                      archived: false,
                      created_at: new Date().toISOString(),
                    },
                    ...cur,
                  ]);
                  setNewContent("");
                  setNewCategory("auto");
                  setCreating(false);
                }}
              >
                Save memory
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Detail modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-label="Memory detail">
          <div className="absolute inset-0 bg-navy/30" onClick={() => { setOpen(null); setConfirmDelete(false); setEditing(false); }} />
          <Card className="relative w-full max-w-[480px] p-6">
            <button
              aria-label="Close"
              onClick={() => { setOpen(null); setConfirmDelete(false); setEditing(false); }}
              className="absolute right-4 top-4 flex size-8 cursor-pointer items-center justify-center rounded-lg text-ink-muted hover:bg-indigo-50"
            >
              <X className="size-4" aria-hidden />
            </button>
            <Chip tone={categoryTone[open.category]} className="capitalize">{open.category}</Chip>
            {editing ? (
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={4}
                autoFocus
                aria-label="Edit memory content"
                className="mt-3 w-full rounded-[10px] border border-line bg-white p-3 text-[15px] leading-relaxed text-navy focus:border-indigo-300"
              />
            ) : (
              <p className="mt-3 pr-6 text-[15px] leading-relaxed text-navy">{open.content}</p>
            )}
            <p className="mt-3 text-xs text-ink-muted">
              Saved {fmtDay(open.created_at).toLowerCase()} via {open.source_channel === "whatsapp" ? "WhatsApp" : "the web"}
              {open.tags.length > 0 && <> · {open.tags.map((t) => `#${t}`).join(" ")}</>}
            </p>

            {confirmDelete ? (
              <div className="mt-5 rounded-[12px] border border-danger/40 bg-danger/5 p-4">
                <p className="text-sm font-medium text-navy">Delete this memory permanently?</p>
                <p className="mt-1 text-xs text-ink-muted">
                  This cannot be undone. The memory and its search index entry are removed immediately.
                </p>
                <div className="mt-3 flex gap-2">
                  <Button variant="danger" size="sm" onClick={() => deleteForever(open.id)}>
                    <Trash2 className="size-4" aria-hidden />
                    Delete permanently
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                    Keep it
                  </Button>
                </div>
              </div>
            ) : editing ? (
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={!editContent.trim()}
                  onClick={() => {
                    const updated = { ...open, content: editContent.trim() };
                    setItems((cur) => cur.map((m) => (m.id === open.id ? updated : m)));
                    setOpen(updated);
                    setEditing(false);
                  }}
                >
                  Save changes
                </Button>
              </div>
            ) : (
              <div className="mt-5 flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => { setEditContent(open.content); setEditing(true); }}
                >
                  Edit
                </Button>
                <Button variant="secondary" size="sm" onClick={() => toggleFav(open.id)}>
                  <Star className={cn("size-4", open.favorite && "fill-warning text-warning")} aria-hidden />
                  {open.favorite ? "Unfavorite" : "Favorite"}
                </Button>
                <Button variant="ghost" size="sm" className="ml-auto text-danger" onClick={() => setConfirmDelete(true)}>
                  Delete
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
