/**
 * Web locale resolution (multilingual Phase 2, backend spec §17.5).
 *
 * No URL prefixes: the locale is a per-browser choice, resolved in this
 * order — an explicit `?lang=` on the URL (the WhatsApp welcome link carries
 * the chat language), then the `amiva_lang` cookie (written by that param,
 * and kept in step with the signed-in user's chat language), then the
 * browser's Accept-Language, then English. The proxy turns the param into
 * the cookie; `src/i18n/request.ts` does the rest.
 *
 * Only languages enabled for chat ship here: adding one = a message file +
 * an entry below, and it goes through the same draft → review gate as the
 * backend catalogs (BE scripts/review_i18n_catalog.py --json-dir messages).
 */

export const locales = ["en", "fr", "it"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

/** Cookie the proxy writes from `?lang=` and the app keeps in sync with the
 *  user's chat language. One year; SameSite=Lax so the WhatsApp deep link
 *  (a cross-site navigation) still sends it on the next request. */
export const LANG_COOKIE = "amiva_lang";
export const LANG_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
/** Request header the proxy sets from `?lang=` for the current render. */
export const LANG_PARAM_HEADER = "x-amiva-lang";

export function isLocale(value: string | null | undefined): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

/** `fr-FR` → `fr`; anything unsupported → null. */
export function toLocale(tag: string | null | undefined): Locale | null {
  if (!tag) return null;
  const base = tag.trim().toLowerCase().split(/[-_]/)[0];
  return isLocale(base) ? base : null;
}

/** Pick the best supported locale from an Accept-Language header (RFC 9110
 *  q-values, highest first; `*` and unsupported tags are skipped). */
export function negotiate(acceptLanguage: string | null | undefined): Locale | null {
  if (!acceptLanguage) return null;
  const ranked = acceptLanguage
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params
        .map((p) => p.trim())
        .find((p) => p.startsWith("q="));
      const weight = q ? Number(q.slice(2)) : 1;
      return { tag: tag.trim(), weight: Number.isFinite(weight) ? weight : 0, index };
    })
    .filter((r) => r.tag && r.tag !== "*" && r.weight > 0)
    .sort((a, b) => b.weight - a.weight || a.index - b.index);
  for (const r of ranked) {
    const locale = toLocale(r.tag);
    if (locale) return locale;
  }
  return null;
}

export function pickLocale(input: {
  param?: string | null;
  cookie?: string | null;
  acceptLanguage?: string | null;
}): Locale {
  return (
    toLocale(input.param) ??
    toLocale(input.cookie) ??
    negotiate(input.acceptLanguage) ??
    defaultLocale
  );
}
