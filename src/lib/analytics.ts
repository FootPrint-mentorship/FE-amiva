/**
 * Product analytics (Umami Cloud, free Hobby tier — owner decision 1 Oct 2026).
 *
 * Umami is cookie-free and anonymous, so no consent banner is needed. The
 * tracker script is injected by the root layout only when
 * NEXT_PUBLIC_UMAMI_WEBSITE_ID is set, so local dev and preview builds send
 * nothing. Page views (incl. UTM source/medium/campaign and referrer) are
 * automatic; this module is for the handful of OUTCOME events that page
 * views cannot show — a completed sign-up, a WhatsApp link, a finished
 * onboarding. Click events on CTAs use the declarative
 * `data-umami-event="…"` attribute instead (see components/marketing).
 *
 * Event names are the single source of truth below so the Umami dashboard
 * never fills with near-duplicates. Keep payloads to a few short values and
 * never include identifiers, emails, phone numbers or message content.
 */

type UmamiTracker = {
  track: (event: string, data?: Record<string, string | number | boolean>) => void;
};

declare global {
  interface Window {
    umami?: UmamiTracker;
  }
}

export const EVENTS = {
  signupCompleted: "signup-completed", // data: { method: "email" | "google" }
  loginCompleted: "login-completed",
  whatsappLinked: "whatsapp-linked", // data: { via: "deep-link" | "settings" }
  onboardingFinished: "onboarding-finished", // data: { step: number }
  firstRequestSent: "first-request-sent",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

/** Fire-and-forget; a no-op when the tracker is absent (dev, blocked, SSR). */
export function track(event: EventName, data?: Record<string, string | number | boolean>): void {
  if (typeof window === "undefined") return;
  try {
    window.umami?.track(event, data);
  } catch {
    // analytics must never break the product
  }
}
