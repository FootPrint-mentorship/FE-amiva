/**
 * PII scrubbing shared by every Sentry init (client, server, edge) — the
 * NDPA/POPIA posture mirrored from the backend's app/core/sentry.py: message
 * text carriers are scrubbed so phone numbers / WhatsApp JIDs and email
 * addresses never leave the browser or server in an event.
 */

// Phone numbers / WhatsApp ids are long digit runs, bare or as JIDs
// (digits@lid / digits@c.us). ULIDs and UUIDs mix in letters and survive.
const JID_RE = /\+?\d{9,15}(@(?:lid|c\.us|s\.whatsapp\.net|g\.us))?/g;
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

export function scrubText(value: string): string {
  return value.replace(EMAIL_RE, "[email]").replace(JID_RE, "[number]");
}

function scrubAny(value: unknown): unknown {
  if (typeof value === "string") return scrubText(value);
  if (Array.isArray(value)) return value.map(scrubAny);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = scrubAny(v);
    }
    return out;
  }
  return value;
}

/* Sentry's event/breadcrumb types vary per runtime bundle; the scrubbers only
 * touch well-known string carriers, so they take and return plain shapes. */

export function scrubEvent<E>(event: E): E {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = event as any;
  if (e.message) e.message = scrubText(e.message);
  if (e.logentry) e.logentry = scrubAny(e.logentry);
  if (e.breadcrumbs) e.breadcrumbs = scrubAny(e.breadcrumbs);
  if (e.extra) e.extra = scrubAny(e.extra);
  for (const exc of e.exception?.values ?? []) {
    if (exc.value) exc.value = scrubText(exc.value);
  }
  if (e.request) {
    delete e.request.data;
    delete e.request.cookies;
    delete e.request.query_string;
    e.request.headers = {};
  }
  delete e.user;
  return event;
}

export function scrubBreadcrumb<B>(crumb: B): B {
  return scrubAny(crumb) as B;
}
