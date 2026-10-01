import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { AppShell } from "./app-shell";

// The dashboard is per-user, authed content — never search-indexable.
// robots.txt already disallows crawling /app/; this covers URLs Google
// learned some other way.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// The dashboard itself is English until multilingual Phase 3, but the form
// components it shares with the auth funnel (phone / password / OTP fields)
// read their labels through next-intl, so they need the provider here too.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider>
      <AppShell>{children}</AppShell>
    </NextIntlClientProvider>
  );
}
