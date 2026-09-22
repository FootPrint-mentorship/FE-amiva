/**
 * Client-side Sentry (Next 16 instrumentation-client convention). Inactive
 * unless NEXT_PUBLIC_SENTRY_DSN is set at build time — local dev and preview
 * builds never pollute the feed, mirroring the backend's SENTRY_DSN gate.
 *
 * Replay is error-only (free tier ≈50 replays/month) with Sentry's default
 * full text/media masking on, so what users typed never leaves the browser.
 */
import * as Sentry from "@sentry/nextjs";

import { scrubBreadcrumb, scrubEvent } from "@/lib/sentry-scrub";

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? "production",
    sendDefaultPii: false,
    tracesSampleRate: 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      // Defaults mask all text and block all media — required posture here.
      Sentry.replayIntegration(),
    ],
    beforeSend: (event) => scrubEvent(event),
    beforeBreadcrumb: (crumb) => scrubBreadcrumb(crumb),
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
