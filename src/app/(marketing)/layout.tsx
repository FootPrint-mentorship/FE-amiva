import Link from "next/link";
import { Logo } from "@/components/logo";
import { WA_LINK } from "@/lib/site";
import { MessageCircle } from "lucide-react";
import { Year } from "@/components/year";
import { CtaPair } from "@/components/marketing/cta-pair";
import { MarketingHeader } from "@/components/marketing/header";

// Server layout (split 24 Aug 2026): only the header is a client island —
// the footer and shell are static HTML, so marketing pages hydrate less JS.

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
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      {/* Keyboard users skip the repeated header on every page. */}
      <a
        href="#content"
        className="sr-only z-50 rounded-lg bg-indigo-900 px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <MarketingHeader />

      {/* ── Main content ───────────────────── */}
      <main id="content" className="flex-1">{children}</main>

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
              <Logo size={30} />
              <p className="max-w-72 leading-[1.6] text-ink-muted">
                Your personal chief of staff, on WhatsApp.
              </p>
              {/* <p className="max-w-72 leading-[1.6] text-ink-muted">
                If you connect Google Calendar, Amiva only accesses the calendar
                data needed to create and manage the events you ask for. See our{" "}
                <Link
                  href="/privacy-policy"
                  className="font-semibold text-navy hover:text-indigo-900"
                >
                  Privacy Policy
                </Link>
                .
              </p> */}
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
              marginTop: "-90px",
            }}
          >
            Amiva
          </p>
        </div>
      </footer>
    </div>
  );
}
