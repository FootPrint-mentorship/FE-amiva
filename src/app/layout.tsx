import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
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
  alternates: { canonical: "/" },
  openGraph: {
    siteName: "Amiva",
    title: "Amiva | Your personal chief of staff, on WhatsApp",
    description:
      "Reminders, calendar, email and memory, managed through one natural conversation on WhatsApp, with a web dashboard for everything else.",
    url: "https://tryamiva.com",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Amiva — your personal chief of staff, on WhatsApp" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og.png"],
  },
};

const UMAMI_WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: the body's first script adds the `js` class
    // BEFORE hydration (the reveal-hidden gate below), so the client html
    // element never matches the server-rendered one — that mismatch is the
    // whole point. Scoped to this element's attributes only; child
    // mismatches still warn.
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
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
        {/* Umami (cookie-free analytics, free tier). Loads only when the site id
            is configured, so dev/preview builds send nothing. Page views and
            UTM attribution are automatic; umami.track() adds outcome events
            (src/lib/analytics.ts). Umami derives UTM parameters SERVER-side
            from the reported URL, so the query string must reach it — instead
            of data-exclude-search, the before-send hook strips only the
            sensitive params (link/reset tokens, OAuth codes) from the URL. */}
        {UMAMI_WEBSITE_ID && (
          <>
            <Script id="umami-before-send" strategy="beforeInteractive">
              {`window.amivaUmamiBeforeSend=function(type,payload){try{var u=new URL(payload.url,location.origin);["token","code","state","scope","authuser","prompt"].forEach(function(k){u.searchParams.delete(k)});payload.url=u.pathname+u.search+u.hash;if(payload.referrer){var r=new URL(payload.referrer,location.origin);["token","code"].forEach(function(k){r.searchParams.delete(k)});payload.referrer=r.href}}catch(e){}return payload};`}
            </Script>
            <Script
              src="https://cloud.umami.is/script.js"
              data-website-id={UMAMI_WEBSITE_ID}
              data-domains="tryamiva.com,www.tryamiva.com"
              data-before-send="amivaUmamiBeforeSend"
              strategy="afterInteractive"
            />
          </>
        )}
      </body>
    </html>
  );
}
