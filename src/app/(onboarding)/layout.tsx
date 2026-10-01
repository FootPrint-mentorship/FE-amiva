import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";

/** Onboarding is part of the multilingual Phase 2 surface (with the auth
 *  funnel): resolve the locale here and hand messages to the wizard. */
export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  return (
    <NextIntlClientProvider>
      <div lang={locale} className="contents">
        {children}
      </div>
    </NextIntlClientProvider>
  );
}
