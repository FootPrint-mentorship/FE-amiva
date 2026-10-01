import Link from "next/link";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/logo";
import { Year } from "@/components/year";

/** Animated left-side brand panel shared by the auth screens and onboarding.
 *  Localized (Phase 2): renders inside a NextIntlClientProvider. */
export function BrandPanel() {
  const t = useTranslations("brand");
  const bubbles = [
    { text: t("bubbleUser"), who: "user" as const, delay: "0s" },
    { text: t("bubbleDone"), who: "amiva" as const, delay: "5s" },
    { text: t("bubbleSaved"), who: "amiva" as const, delay: "10s" },
  ];
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

      <Link href="/" aria-label={t("home")} className="relative">
        <Logo variant="light" size={32} />
      </Link>

      <div className="relative">
        <p className="max-w-90 text-3xl font-semibold leading-snug text-white">
          {t("tagline")}
        </p>
        <p className="mt-4 max-w-90 text-white/60">{t("sub")}</p>

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
