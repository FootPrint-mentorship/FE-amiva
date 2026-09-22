"use client";

import { useId, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/cn";

export type SelectOption = { value: string; label: string; hint?: string };

/**
 * Brand-styled replacement for native <select>: ARIA combobox trigger +
 * listbox panel, arrow-key navigation, Enter/Escape, optional search for
 * long lists (e.g. timezones). Use this instead of <select> everywhere.
 */
export function Select({
  value,
  onChange,
  options,
  label,
  placeholder = "Select…",
  searchable = false,
  className,
  hideHintInTrigger = false,
}: {
  value: string | null;
  onChange: (value: string) => void;
  options: SelectOption[];
  label: string;
  placeholder?: string;
  searchable?: boolean;
  className?: string;
  hideHintInTrigger?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listboxId = useId();
  const listRef = useRef<HTMLUListElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selected = options.find((o) => o.value === value) ?? null;
  const filtered = query.trim()
    ? options.filter((o) =>
        `${o.label} ${o.hint ?? ""}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      )
    : options;

  const openPanel = () => {
    setQuery("");
    setActive(
      Math.max(
        0,
        options.findIndex((o) => o.value === value),
      ),
    );
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const pick = (v: string) => {
    onChange(v);
    close();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      close();
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next =
        e.key === "ArrowDown"
          ? Math.min(active + 1, filtered.length - 1)
          : Math.max(active - 1, 0);
      setActive(next);
      listRef.current?.children[next]?.scrollIntoView({ block: "nearest" });
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[active]) pick(filtered[active].value);
    }
  };

  return (
    <div
      className={cn("relative", className)}
      onKeyDown={open ? onKey : undefined}
    >
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-haspopup="listbox"
        aria-label={label}
        onClick={() => (open ? setOpen(false) : openPanel())}
        onKeyDown={(e) => {
          if (
            !open &&
            (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")
          ) {
            e.preventDefault();
            openPanel();
          }
        }}
        className="flex h-11 w-full cursor-pointer items-center gap-2 rounded-control border border-line bg-white px-3.5 text-left text-[15px] text-navy hover:border-indigo-300"
      >
        <span
          className={cn(
            "min-w-0 flex-1 truncate",
            !selected && "text-ink-muted",
          )}
        >
          {selected ? selected.label : placeholder}
        </span>
        {selected?.hint && !hideHintInTrigger && (
          <span className="shrink-0 text-xs text-ink-muted">
            {selected.hint}
          </span>
        )}
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-ink-muted transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={close} aria-hidden />
          <div className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-line bg-white shadow-pop">
            {searchable && (
              <div className="flex items-center gap-2 border-b border-line px-3">
                <Search
                  className="size-3.5 shrink-0 text-ink-muted"
                  aria-hidden
                />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActive(0);
                  }}
                  placeholder="Search…"
                  aria-label={`Search ${label}`}
                  className="h-10 w-full bg-transparent text-sm text-navy outline-none placeholder:text-ink-muted"
                  style={{ boxShadow: "none", border: "none" }}
                />
              </div>
            )}
            <ul
              ref={listRef}
              id={listboxId}
              role="listbox"
              aria-label={label}
              tabIndex={-1}
              className="max-h-64 overflow-y-auto py-1"
            >
              {filtered.length === 0 ? (
                <li className="px-3.5 py-2.5 text-sm text-ink-muted">
                  No matches
                </li>
              ) : (
                filtered.map((o, i) => (
                  <li
                    key={o.value}
                    role="option"
                    aria-selected={o.value === value}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => pick(o.value)}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 px-3.5 py-2.5 text-sm text-navy",
                      i === active && "bg-indigo-50",
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate">{o.label}</span>
                    {o.hint && (
                      <span className="shrink-0 text-xs text-ink-muted">
                        {o.hint}
                      </span>
                    )}
                    {o.value === value && (
                      <Check
                        className="size-4 shrink-0 text-indigo-900"
                        aria-hidden
                      />
                    )}
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
