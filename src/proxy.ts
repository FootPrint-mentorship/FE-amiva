import { NextResponse, type NextRequest } from "next/server";
import {
  LANG_COOKIE,
  LANG_COOKIE_MAX_AGE,
  LANG_PARAM_HEADER,
  toLocale,
} from "@/i18n/config";

/**
 * `?lang=fr` (the WhatsApp welcome link carries the chat language) becomes
 * the `amiva_lang` cookie for every later request, and is forwarded to THIS
 * request as a header so the page that was just opened already renders in
 * that language — a cookie set on the response is not visible to the same
 * request's server components.
 */
export function proxy(request: NextRequest) {
  const locale = toLocale(request.nextUrl.searchParams.get("lang"));
  if (!locale) return NextResponse.next();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(LANG_PARAM_HEADER, locale);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.cookies.set(LANG_COOKIE, locale, {
    path: "/",
    maxAge: LANG_COOKIE_MAX_AGE,
    sameSite: "lax",
  });
  return response;
}

export const config = {
  // Every page, none of the static assets or Next internals.
  matcher: ["/((?!_next/|api/|.*\\..*).*)"],
};
