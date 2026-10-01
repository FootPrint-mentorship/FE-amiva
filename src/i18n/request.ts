import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { LANG_COOKIE, LANG_PARAM_HEADER, pickLocale, type Locale } from "@/i18n/config";
import en from "../../messages/en.json";

type Messages = typeof en;

/** A locale's message file, overlaid on English so a key that is missing
 *  (or not yet drafted) falls back per key. A locale listed in config but
 *  without a message file renders English rather than failing the page. */
async function loadMessages(locale: Locale): Promise<Messages> {
  if (locale === "en") return en;
  try {
    const extra = (await import(`../../messages/${locale}.json`)).default as Partial<Messages>;
    const merged = { ...en } as Record<string, unknown>;
    for (const [ns, values] of Object.entries(extra)) {
      merged[ns] = { ...(en as Record<string, unknown>)[ns] as object, ...(values as object) };
    }
    return merged as Messages;
  } catch {
    return en;
  }
}

/**
 * next-intl request config (no i18n routing). Reads the locale the proxy
 * forwarded from `?lang=` (request header), else the cookie, else the
 * browser's Accept-Language.
 */
export default getRequestConfig(async () => {
  const [h, c] = await Promise.all([headers(), cookies()]);
  const locale = pickLocale({
    param: h.get(LANG_PARAM_HEADER),
    cookie: c.get(LANG_COOKIE)?.value,
    acceptLanguage: h.get("accept-language"),
  });
  return { locale, messages: await loadMessages(locale) };
});
