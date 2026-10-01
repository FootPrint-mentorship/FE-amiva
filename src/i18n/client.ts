import { LANG_COOKIE, LANG_COOKIE_MAX_AGE, toLocale } from "@/i18n/config";

/**
 * Keep the web locale in step with the signed-in user's chat language
 * (`users.language`, spec §17.1): called whenever the profile loads or the
 * Settings choice changes. Writes the same cookie the proxy writes from
 * `?lang=`; a language the web does not ship yet is ignored. The change
 * applies from the next server render — no reload is forced, the dashboard
 * itself is not translated until Phase 3.
 */
export function rememberLocale(language: string | null | undefined): void {
  if (typeof document === "undefined") return;
  const locale = toLocale(language);
  if (!locale) return;
  const current = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${LANG_COOKIE}=`))
    ?.split("=")[1];
  if (current === locale) return;
  document.cookie = `${LANG_COOKIE}=${locale}; Path=/; Max-Age=${LANG_COOKIE_MAX_AGE}; SameSite=Lax`;
}
