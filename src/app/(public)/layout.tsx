import type { Metadata } from "next";
import Link from "next/link";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Logo } from "@/components/logo";
import { BrandPanel } from "@/components/brand-panel";

// Auth funnel pages carry no search value and shouldn't appear in results.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * The auth funnel is the multilingual Phase 2 surface: this layout resolves
 * the locale (see src/i18n) and hands messages to the client pages. The root
 * layout stays static and English (`<html lang="en">`); the localized region
 * is marked with its own `lang` so assistive tech reads it correctly.
 */
export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const t = await getTranslations("brand");
  return (
    <NextIntlClientProvider>
      <div lang={locale} className="flex min-h-screen">
        <BrandPanel />
        <main className="flex flex-1 flex-col items-center justify-center bg-soft px-5 py-10">
          <Link href="/" className="mb-8 lg:hidden" aria-label={t("home")}>
            <Logo size={32} />
          </Link>
          <div className="w-full max-w-105">{children}</div>
        </main>
      </div>
    </NextIntlClientProvider>
  );
}
