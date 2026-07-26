"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Sun,
  MessageSquare,
  AlarmClock,
  CalendarDays,
  CheckSquare,
  ListChecks,
  Brain,
  Mail,
  History,
  Settings,
  Search,
  Bell,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { pendingConfirmations, user } from "@/lib/mock";

const nav = [
  { href: "/app/today", label: "Today", icon: Sun },
  { href: "/app/chat", label: "Chat", icon: MessageSquare },
  { href: "/app/reminders", label: "Reminders", icon: AlarmClock },
  { href: "/app/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/app/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/app/lists", label: "Lists", icon: ListChecks },
  { href: "/app/memories", label: "Memories", icon: Brain },
  { href: "/app/email", label: "Email", icon: Mail },
  { href: "/app/activity", label: "Activity", icon: History },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex min-h-screen bg-soft">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-white md:flex">
        <Link href="/app/today" className="flex items-center gap-2.5 px-5 py-5">
          <Image src="/brand/mark.svg" alt="" width={30} height={30} className="rounded-[22%]" />
          <span className="text-lg font-semibold tracking-tight text-navy">Amiva</span>
        </Link>
        <nav className="flex-1 space-y-0.5 px-3">
          {nav.map((n) => {
            const active = pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-indigo-900 text-white"
                    : "text-ink-muted hover:bg-indigo-50 hover:text-navy"
                )}
              >
                <n.icon className="size-4.5" aria-hidden />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-line p-3">
          <Link
            href="/app/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink-muted hover:bg-indigo-50 hover:text-navy"
          >
            <Settings className="size-4.5" aria-hidden />
            Settings
          </Link>
          <div className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-violet-500 text-sm font-semibold text-white">
              {user.preferred_name[0]}
            </span>
            <div className="leading-tight">
              <p className="text-sm font-medium text-navy">{user.preferred_name}</p>
              <p className="text-xs text-ink-muted">{user.timezone}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col md:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-white/85 px-4 backdrop-blur md:px-6">
          <button className="flex h-9 w-full max-w-[420px] cursor-pointer items-center gap-2 rounded-[10px] border border-line bg-soft px-3 text-sm text-ink-muted hover:border-indigo-300">
            <Search className="size-4" aria-hidden />
            Search or ask Amiva…
            <kbd className="ml-auto rounded border border-line bg-white px-1.5 text-[10px] text-ink-muted">
              ⌘K
            </kbd>
          </button>
          <div className="ml-auto flex items-center gap-1.5">
            <button
              className="relative flex size-9 cursor-pointer items-center justify-center rounded-[10px] text-ink-muted hover:bg-indigo-50"
              aria-label={`${pendingConfirmations.length} pending confirmations`}
            >
              <ShieldAlert className="size-5" aria-hidden />
              {pendingConfirmations.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-warning text-[10px] font-bold text-white">
                  {pendingConfirmations.length}
                </span>
              )}
            </button>
            <button
              className="flex size-9 cursor-pointer items-center justify-center rounded-[10px] text-ink-muted hover:bg-indigo-50"
              aria-label="Notifications"
            >
              <Bell className="size-5" aria-hidden />
            </button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 md:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
