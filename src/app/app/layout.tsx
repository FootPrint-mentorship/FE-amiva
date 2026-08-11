"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Sun,
  MessageSquare,
  AlarmClock,
  CalendarDays,
  CheckSquare,
  Brain,
  Settings,
  Search,
  Bell,
  ShieldAlert,
  Menu,
  X,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import { fmtDay, fmtTime } from "@/lib/mock";
import { useStore } from "@/lib/store";
import {
  confirmationsStore,
  notificationsStore,
  settingsStore,
  type FeatureKey,
} from "@/lib/stores";
import { sessionActive, signOut as endSession, loadMe } from "@/lib/data/auth";
import { hydrateAll } from "@/lib/data/collections";
import { completePendingLink } from "@/lib/data/linking";
import { hydrateConfirmations, resolveConfirmationRemote } from "@/lib/data/assistant";
import { hydrateNotifications, markNotificationsRead } from "@/lib/data/notifications";
import { USE_MOCKS } from "@/lib/api/client";
import { SearchPalette } from "@/components/search-palette";
import { Modal } from "@/components/ui/modal";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

const nav: { href: string; label: string; icon: typeof Sun; feature?: FeatureKey }[] = [
  { href: "/app/today", label: "Today", icon: Sun },
  { href: "/app/chat", label: "Chat", icon: MessageSquare, feature: "chat" },
  { href: "/app/reminders", label: "Reminders", icon: AlarmClock, feature: "reminders" },
  { href: "/app/calendar", label: "Calendar", icon: CalendarDays, feature: "calendar" },
  { href: "/app/tasks", label: "Tasks", icon: CheckSquare, feature: "tasks" },
  { href: "/app/memories", label: "Memories", icon: Brain, feature: "memories" },
];

function NavLinks({
  pathname,
  features,
  onNavigate,
}: {
  pathname: string;
  features: Record<FeatureKey, boolean>;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 space-y-0.5 px-3">
      {nav
        .filter((n) => !n.feature || features[n.feature])
        .map((n) => {
        const active = pathname.startsWith(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            onClick={onNavigate}
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
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [trayOpen, setTrayOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const confirmations = useStore(confirmationsStore);
  const notifications = useStore(notificationsStore);
  const settings = useStore(settingsStore);
  const pending = confirmations.filter((c) => c.status === "pending");
  const unread = notifications.filter((n) => !n.read);

  // Session guard: mock flag in mock mode, real tokens otherwise.
  useEffect(() => {
    const t = setTimeout(() => {
      if (!sessionActive()) router.replace("/login");
      else setReady(true);
    }, 0);
    return () => clearTimeout(t);
  }, [router]);

  // Real-API mode: pull the user + collections into the shared stores.
  useEffect(() => {
    if (!ready || USE_MOCKS) return;
    // A WhatsApp deep-link token may be waiting from before sign-in/signup —
    // complete the link now that we know which account to bind (spec §3.1.3).
    completePendingLink().then((linked) => {
      if (linked) toast("WhatsApp linked, chat with Amiva any time.");
    });
    Promise.all([
      loadMe(),
      hydrateAll(),
      hydrateConfirmations(),
      hydrateNotifications(),
    ]).catch(() => {
      toast("Couldn't reach the Amiva backend. Showing what's cached.", { tone: "error" });
    });
  }, [ready]);

  // Theme: explicit choice wins, otherwise follow the OS.
  const systemDark = useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
    () => false
  );
  const dark = settings.theme === "dark" || (settings.theme === "system" && systemDark);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((s) => !s);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-soft">
        <Image src="/brand/mark.svg" alt="Amiva loading" width={40} height={40} className="animate-pulse rounded-[22%]" />
      </div>
    );
  }

  const signOut = () => {
    setSigningOut(true);
    void endSession().finally(() => router.replace("/login"));
  };

  return (
    <div className={cn("flex min-h-screen bg-soft", dark && "theme-dark")}>
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-white md:flex">
        <Link href="/app/today" className="flex items-center gap-2.5 px-5 py-5">
          <Image src="/brand/mark.svg" alt="" width={30} height={30} className="rounded-[22%]" />
          <span className="text-lg font-semibold tracking-tight text-navy">Amiva</span>
        </Link>
        <NavLinks pathname={pathname} features={settings.features} />
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
              {settings.preferredName[0]}
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-medium text-navy">{settings.preferredName}</p>
              <p className="truncate text-xs text-ink-muted">{settings.timezone}</p>
            </div>
            <button
              aria-label="Sign out"
              title="Sign out"
              onClick={() => setConfirmSignOut(true)}
              className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-ink-muted hover:bg-indigo-50 hover:text-navy"
            >
              <LogOut className="size-4" aria-hidden />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col md:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-white/85 px-4 backdrop-blur md:px-6">
          <button
            aria-label="Open navigation"
            onClick={() => setDrawerOpen(true)}
            className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-[10px] text-ink-muted hover:bg-indigo-50 md:hidden"
          >
            <Menu className="size-5" aria-hidden />
          </button>
          <button
            onClick={() => setSearchOpen(true)}
            className="flex h-9 w-full max-w-105 cursor-pointer items-center gap-2 rounded-[10px] border border-line bg-soft px-3 text-sm text-ink-muted hover:border-indigo-300"
          >
            <Search className="size-4" aria-hidden />
            Search or ask Amiva…
            <kbd className="ml-auto hidden rounded border border-line bg-white px-1.5 text-[10px] text-ink-muted sm:inline-block">
              ⌘K
            </kbd>
          </button>
          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={() => setTrayOpen(true)}
              className="relative flex size-9 cursor-pointer items-center justify-center rounded-[10px] text-ink-muted hover:bg-indigo-50"
              aria-label={`${pending.length} pending confirmations`}
            >
              <ShieldAlert className="size-5" aria-hidden />
              {pending.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-warning text-[10px] font-bold text-white">
                  {pending.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setNotifOpen(true)}
              className="relative flex size-9 cursor-pointer items-center justify-center rounded-[10px] text-ink-muted hover:bg-indigo-50"
              aria-label={`Notifications, ${unread.length} unread`}
            >
              <Bell className="size-5" aria-hidden />
              {unread.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-cyan-600 text-[10px] font-bold text-white">
                  {unread.length}
                </span>
              )}
            </button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-300 flex-1 px-4 py-6 md:px-8">
          {children}
        </main>
      </div>

      {searchOpen && <SearchPalette onClose={() => setSearchOpen(false)} />}

      {/* Confirmation tray */}
      {trayOpen && (
        <Modal label="Pending confirmations" position="right" onClose={() => setTrayOpen(false)}>
          <div className="flex h-screen w-96 max-w-[calc(100vw-2rem)] flex-col bg-white shadow-pop">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-semibold text-navy">Waiting for your approval</h2>
              <button
                aria-label="Close"
                onClick={() => setTrayOpen(false)}
                className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-ink-muted hover:bg-indigo-50"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {pending.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-center">
                  <ShieldCheck className="size-7 text-success" aria-hidden />
                  <p className="text-sm font-medium text-navy">Nothing waiting on you</p>
                  <p className="max-w-60 text-xs text-ink-muted">
                    Amiva asks here before doing anything consequential.
                  </p>
                </div>
              ) : (
                pending.map((c) => (
                  <Card key={c.id} className="p-4">
                    <p className="text-sm leading-relaxed text-navy">{c.summary}</p>
                    <Chip tone="warning" className="mt-2">
                      {c.risk === "high" ? "High impact" : "Needs approval"}
                    </Chip>
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          resolveConfirmationRemote(c.id, "approved")
                            .then((reply) => toast(reply))
                            .catch(() => toast("That didn't go through — nothing was changed.", { tone: "error" }));
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          resolveConfirmationRemote(c.id, "rejected")
                            .then((reply) => toast(reply, { tone: "info" }))
                            .catch(() => toast("That didn't go through — nothing was changed.", { tone: "error" }));
                        }}
                      >
                        Reject
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Notifications panel */}
      {notifOpen && (
        <Modal label="Notifications" position="right" onClose={() => setNotifOpen(false)}>
          <div className="flex h-screen w-96 max-w-[calc(100vw-2rem)] flex-col bg-white shadow-pop">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-semibold text-navy">Notifications</h2>
              <div className="flex items-center gap-1">
                {unread.length > 0 && (
                  <button
                    onClick={() => void markNotificationsRead({ all: true })}
                    className="cursor-pointer rounded-lg px-2 py-1 text-xs font-medium text-indigo-900 hover:bg-indigo-50"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  aria-label="Close"
                  onClick={() => setNotifOpen(false)}
                  className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-ink-muted hover:bg-indigo-50"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </div>
            </div>
            <div className="flex-1 divide-y divide-line overflow-y-auto">
              {notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.href}
                  onClick={() => {
                    void markNotificationsRead({ ids: [n.id] });
                    setNotifOpen(false);
                  }}
                  className={cn("block px-5 py-3.5 hover:bg-soft", !n.read && "bg-cyan-500/5")}
                >
                  <p className="flex items-center gap-2 text-sm font-medium text-navy">
                    {!n.read && <span className="size-1.5 rounded-full bg-cyan-600" aria-label="Unread" />}
                    {n.title}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{n.body}</p>
                  <p className="mt-1 text-[11px] text-ink-muted">
                    {fmtDay(n.at)} {fmtTime(n.at)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* Mobile nav drawer */}
      {drawerOpen && (
        <Modal label="Navigation" position="left" onClose={() => setDrawerOpen(false)}>
          <div className="flex h-screen w-67.5 flex-col bg-white shadow-pop md:hidden">
            <div className="flex items-center justify-between px-5 py-4">
              <span className="flex items-center gap-2.5">
                <Image src="/brand/mark.svg" alt="" width={28} height={28} className="rounded-[22%]" />
                <span className="text-lg font-semibold tracking-tight text-navy">Amiva</span>
              </span>
              <button
                aria-label="Close navigation"
                onClick={() => setDrawerOpen(false)}
                className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-ink-muted hover:bg-indigo-50"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
            <NavLinks pathname={pathname} features={settings.features} onNavigate={() => setDrawerOpen(false)} />
            <div className="border-t border-line p-3">
              <Link
                href="/app/settings"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink-muted hover:bg-indigo-50 hover:text-navy"
              >
                <Settings className="size-4.5" aria-hidden />
                Settings
              </Link>
              <button
                onClick={() => {
                  setDrawerOpen(false);
                  setConfirmSignOut(true);
                }}
                className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink-muted hover:bg-indigo-50 hover:text-navy"
              >
                <LogOut className="size-4.5" aria-hidden />
                Sign out
              </button>
            </div>
          </div>
        </Modal>
      )}

      {confirmSignOut && (
        <Modal
          label="Confirm sign out"
          onClose={() => !signingOut && setConfirmSignOut(false)}
          panelClassName="w-full max-w-110"
        >
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-navy">Sign out of Amiva?</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              You&apos;ll need to sign in again to see your reminders, tasks and calendar
              here. WhatsApp keeps working as usual.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmSignOut(false)} disabled={signingOut}>
                Stay signed in
              </Button>
              <Button variant="danger" onClick={signOut} loading={signingOut}>
                Sign out
              </Button>
            </div>
          </Card>
        </Modal>
      )}
    </div>
  );
}
