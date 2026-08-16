"use client";

import Link from "next/link";
import { Logo } from "@/components/logo";
import { WA_LINK } from "@/lib/site";
import { MessageCircle, Menu, X } from "lucide-react";
import { Year } from "@/components/year";
import { CtaPair } from "@/components/marketing/cta-pair";
import { useState, useSyncExternalStore } from "react";
import { sessionActive } from "@/lib/data/auth";

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

const footerProduct = [
  { href: "/#features", label: "Features" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

const footerLegal = [
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
];

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const authed = useSyncExternalStore(subscribeToSession, sessionActive, () => false);

  return (
    <div className="flex min-h-screen flex-col bg-surface">
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
                <Link key={n.label} href={n.href} className="hover:text-indigo-900">
                  {n.label}
                </Link>
              )
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
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {/* Mobile nav drawer */}
        {mobileOpen && (
          <div className="absolute left-0 right-0 top-full border-b border-line bg-white px-5 py-6 shadow-[0_20px_30px_rgba(32,24,91,0.08)] md:hidden">
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
                )
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

      {/* ── Main content ───────────────────── */}
      <main className="flex-1">{children}</main>

      {/* ── Footer ─────────────────────────── */}
      <footer className="bg-lavender-100 px-[max(22px,calc(50vw-620px))] pb-10.5 pt-9 text-navy">
        {/* Gradient CTA card */}
        <div className="flex min-h-82.5 flex-col items-center justify-center rounded-[34px] bg-[radial-gradient(at_50%_-15%,#9d92d2_0%,#6655ac_32%,#32236f_72%,var(--color-indigo-900)_100%)] px-6 py-13.75 text-center text-white shadow-[0_24px_55px_rgba(32,24,91,0.18)]">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-300">
            Get started for free
          </span>
          <h2 className="mx-auto mt-3.5 max-w-140 text-[clamp(36px,4vw,54px)] font-bold leading-[1.04] tracking-[-0.055em]">
            Start in the chat you already use.
          </h2>
          <p className="mt-0 text-[13px] text-lavender-200">
            Free to start · No app to install
          </p>
          <CtaPair className="mt-6 justify-center" invert />
        </div>

        {/* White card */}
        <div className="relative mt-4.5 overflow-hidden rounded-[34px] border border-line-soft bg-white pb-0 pt-15.5 shadow-[0_20px_45px_rgba(25,22,48,0.08)]">
          {/* Footer top grid */}
          <div className="relative z-[2] grid gap-10 px-6 md:grid-cols-[2fr_repeat(3,1fr)] md:px-13.5">
            {/* Brand */}
            <div className="flex flex-col items-start gap-3 text-[13px]">
              <Logo size={20} />
              <p className="max-w-62.5 leading-[1.6] text-ink-muted">
                Your personal chief of staff, on WhatsApp.
              </p>
            </div>

            {/* Product */}
            <div className="flex flex-col items-start gap-3 text-[13px]">
              <b className="text-navy">Product</b>
              {footerProduct.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-ink-muted hover:text-navy"
                >
                  {l.label}
                </Link>
              ))}
            </div>

            {/* Legal */}
            <div className="flex flex-col items-start gap-3 text-[13px]">
              <b className="text-navy">Legal</b>
              {footerLegal.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-ink-muted hover:text-navy"
                >
                  {l.label}
                </Link>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-col items-start gap-3 text-[13px]">
              <b className="text-navy">Talk to Amiva</b>
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-indigo-900 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-indigo-700"
              >
                <MessageCircle className="size-4" aria-hidden />
                Open WhatsApp
              </a>
              <a
                href="mailto:support@tryamiva.com"
                className="text-ink-muted hover:text-navy"
              >
                support@tryamiva.com
              </a>
            </div>
          </div>

          {/* Footer bottom */}
          <div className="relative z-[2] mt-11.25 flex flex-wrap items-center justify-between gap-3 border-t border-lavender-100 px-6 py-5 text-[11px] text-ink-soft md:px-13.5">
            <span>
              © <Year /> Amiva. All rights reserved.
            </span>
            <span className="flex gap-4.5">
              <Link href="/privacy-policy" className="hover:text-navy">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-navy">
                Terms
              </Link>
            </span>
          </div>

          {/* Giant wordmark watermark */}
          <p
            aria-hidden
            className="pointer-events-none select-none whitespace-nowrap text-center font-bold leading-[0.75] text-lavender-50"
            style={{
              fontSize: "clamp(250px, 32vw, 480px)",
              letterSpacing: "-0.09em",
              transform: "scaleX(1.12)",
              transformOrigin: "bottom",
              position: "relative",
              bottom: "-180px",
            }}
          >
            Amiva
          </p>
        </div>
      </footer>
    </div>
  );
}
