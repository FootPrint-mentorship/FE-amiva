import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toast";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// applicationName/siteName declare the app name "Amiva" explicitly — it must
// match the OAuth consent screen name for Google brand verification.
export const metadata: Metadata = {
  metadataBase: new URL("https://tryamiva.com"),
  applicationName: "Amiva",
  title: {
    default: "Amiva | Your personal chief of staff, on WhatsApp",
    template: "%s · Amiva",
  },
  description:
    "Reminders, calendar, email and memory, managed through one natural conversation on WhatsApp, with a web dashboard for everything else.",
  openGraph: {
    siteName: "Amiva",
    title: "Amiva | Your personal chief of staff, on WhatsApp",
    description:
      "Reminders, calendar, email and memory, managed through one natural conversation on WhatsApp, with a web dashboard for everything else.",
    url: "https://tryamiva.com",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {/* Runs synchronously before the rest of the body parses: gates the
            reveal-hidden class (globals.css) so content is only ever hidden
            when JS is actually running. */}
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.add('js')",
          }}
        />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
