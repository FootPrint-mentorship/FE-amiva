import Link from "next/link";
import { Logo } from "@/components/logo";
import { Year } from "@/components/year";

const bubbles = [
  { text: "Remind me to pay rent on Friday morning", who: "user" as const, delay: "0s" },
  { text: "⏰ Done. Friday, 9:00 AM. Consider it handled.", who: "amiva" as const, delay: "5s" },
  { text: "💾 Saved under Finance. Ask me any time.", who: "amiva" as const, delay: "10s" },
];

/** Animated left-side brand panel shared by the auth screens and onboarding. */
export function BrandPanel() {
  return (
    <aside className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-gradient-to-b from-indigo-900 to-navy p-10 lg:flex">
      {/* drifting glow */}
      <div
        aria-hidden
        className="brand-panel-glow pointer-events-none absolute -inset-1/4 bg-[radial-gradient(closest-side,rgba(87,199,220,0.22),transparent_65%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.14) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <Link href="/" aria-label="Amiva home" className="relative">
        <Logo variant="light" size={32} />
      </Link>

      <div className="relative">
        <p className="max-w-90 text-3xl font-semibold leading-snug text-white">
          Manage your life and work from one conversation.
        </p>
        <p className="mt-4 max-w-90 text-white/60">
          Reminders, calendar, tasks and memory, handled by your personal
          chief of staff on WhatsApp.
        </p>

        {/* cycling conversation vignette */}
        <div aria-hidden className="relative mt-10 h-24 max-w-90">
          {bubbles.map((b) => (
            <div
              key={b.text}
              className={
                "brand-bubble absolute max-w-72 rounded-2xl px-4 py-2.5 text-sm shadow-pop " +
                (b.who === "user"
                  ? "right-0 rounded-tr-sm bg-cyan-500 text-navy"
                  : "left-0 rounded-tl-sm bg-white/95 text-navy")
              }
              style={{ animationDelay: b.delay }}
            >
              {b.text}
            </div>
          ))}
        </div>
      </div>

      <p className="relative text-xs text-white/40">
        © <Year /> Amiva
      </p>
    </aside>
  );
}
