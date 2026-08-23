"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { Logo } from "@/components/logo";
import { WA_LINK } from "@/lib/site";
import { Menu, X } from "lucide-react";
import { sessionActive } from "@/lib/data/auth";

// The ONLY stateful part of the marketing shell (mobile drawer + session
// state) — split out 24 Aug 2026 so the layout itself renders on the server
// and the page ships less JavaScript (Lighthouse "reduce unused JS").
//
// Session state lives in localStorage (an external system), so it's read
// via useSyncExternalStore: the server snapshot renders the signed-out
// header (no hydration mismatch), the client snapshot reads the real
// session, and cross-tab sign-ins/outs re-render via the storage event.
function subscribeToSession(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

// Contact goes straight to the WhatsApp chat — the product IS the chat.
const nav = [
  { href: "/#features", label: "Features" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "Questions" },
  { href: WA_LINK, label: "Contact", external: true },
];

export function MarketingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const authed = useSyncExternalStore(subscribeToSession, sessionActive, () => false);

  return (
    <div onKeyDown={(e) => e.key === "Escape" && mobileOpen && setMobileOpen(false)}>
      {/* ── Header ─────────────────────────── */}
      <header
        className="sticky top-0 z-40 border-b border-line/80 bg-surface/90 backdrop-blur-[18px]"
        style={{ height: 80 }}
      >
        <div className="mx-auto flex h-full w-full max-w-310 items-center justify-between px-7">
          {/* Logo */}
          <Link href="/" aria-label="Amiva home">
            <Logo size={32} />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-8 text-sm text-[#4f5060] md:flex">
            {nav.map((n) =>
              n.external ? (
                <a
                  key={n.label}
                  href={n.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-indigo-900"
                >
                  {n.label}
                </a>
              ) : (
                <Link
                  key={n.label}
                  href={n.href}
                  className="hover:text-indigo-900"
                >
                  {n.label}
                </Link>
              ),
            )}
          </nav>

          {/* Desktop actions */}
          <div className="hidden items-center gap-5.5 text-sm md:flex">
            {authed ? (
              <Link
                href="/app/today"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-indigo-900 px-5 text-sm font-semibold text-white transition-all hover:bg-indigo-700 hover:-translate-y-px"
              >
                <span>Open app</span>
                <span aria-hidden>→</span>
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-ink hover:text-indigo-900">
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-indigo-900 px-5 text-sm font-semibold text-white transition-all hover:bg-indigo-700 hover:-translate-y-px"
                >
                  <span>Get started</span>
                  <span aria-hidden>→</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="flex size-9 items-center justify-center rounded-lg text-navy md:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </button>
        </div>

        {/* Mobile nav drawer */}
        {mobileOpen && (
          <div
            id="mobile-nav"
            className="absolute left-0 right-0 top-full border-b border-line bg-white px-5 py-6 shadow-[0_20px_30px_rgba(32,24,91,0.08)] md:hidden"
          >
            <nav className="flex flex-col gap-4">
              {nav.map((n) =>
                n.external ? (
                  <a
                    key={n.label}
                    href={n.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[15px] font-medium text-navy"
                    onClick={() => setMobileOpen(false)}
                  >
                    {n.label}
                  </a>
                ) : (
                  <Link
                    key={n.label}
                    href={n.href}
                    className="text-[15px] font-medium text-navy"
                    onClick={() => setMobileOpen(false)}
                  >
                    {n.label}
                  </Link>
                ),
              )}
            </nav>
            <div className="mt-5 flex gap-3">
              {authed ? (
                <Link
                  href="/app/today"
                  className="flex-1 inline-flex h-11 items-center justify-center gap-1 rounded-full bg-indigo-900 text-sm font-semibold text-white"
                >
                  <span>Open app</span>
                  <span aria-hidden>→</span>
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="flex-1 inline-flex h-11 items-center justify-center rounded-full border border-line text-sm font-medium text-navy"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    className="flex-1 inline-flex h-11 items-center justify-center gap-1 rounded-full bg-indigo-900 text-sm font-semibold text-white"
                  >
                    <span>Get started</span>
                    <span aria-hidden>→</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>
    </div>
  );
}
