import { describe, it, expect } from "vitest";
import { negotiate, pickLocale, toLocale } from "@/i18n/config";

describe("web locale resolution (Phase 2)", () => {
  it("maps region tags to a supported base language", () => {
    expect(toLocale("fr-FR")).toBe("fr");
    expect(toLocale("it_IT")).toBe("it");
    expect(toLocale("EN")).toBe("en");
    expect(toLocale("sw")).toBeNull(); // enabled for chat later, not shipped on the web yet
    expect(toLocale(undefined)).toBeNull();
  });

  it("negotiates Accept-Language by quality, skipping unsupported tags", () => {
    expect(negotiate("de-DE,de;q=0.9,fr;q=0.8,en;q=0.7")).toBe("fr");
    expect(negotiate("en-GB,en;q=0.9")).toBe("en");
    expect(negotiate("*")).toBeNull();
    expect(negotiate("ja")).toBeNull();
    expect(negotiate(null)).toBeNull();
  });

  it("prefers the link param, then the cookie, then the browser, then English", () => {
    expect(pickLocale({ param: "it", cookie: "fr", acceptLanguage: "en" })).toBe("it");
    expect(pickLocale({ param: "xx", cookie: "fr", acceptLanguage: "en" })).toBe("fr");
    expect(pickLocale({ cookie: null, acceptLanguage: "fr-CI,fr;q=0.9" })).toBe("fr");
    expect(pickLocale({})).toBe("en");
  });
});
