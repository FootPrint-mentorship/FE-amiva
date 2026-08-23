import type { Metadata } from "next";
import { AppShell } from "./app-shell";

// The dashboard is per-user, authed content — never search-indexable.
// robots.txt already disallows crawling /app/; this covers URLs Google
// learned some other way.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
