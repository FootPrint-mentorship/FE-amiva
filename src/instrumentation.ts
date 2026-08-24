/**
 * Server/edge Sentry for the Next runtime (SSR/route handlers). The app is a
 * pure API client — almost everything user-facing runs in the browser — but a
 * server-side render crash would otherwise vanish into Netlify logs.
 * Inactive unless NEXT_PUBLIC_SENTRY_DSN is set, same gate as the client.
 */
import * as Sentry from "@sentry/nextjs";

import { scrubBreadcrumb, scrubEvent } from "@/lib/sentry-scrub";

export function register() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? "production",
    sendDefaultPii: false,
    tracesSampleRate: 0,
    beforeSend: (event) => scrubEvent(event),
    beforeBreadcrumb: (crumb) => scrubBreadcrumb(crumb),
  });
}

export const onRequestError = Sentry.captureRequestError;
