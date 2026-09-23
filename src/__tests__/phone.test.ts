import { describe, expect, it } from "vitest";

import { buildE164, isValidE164 } from "@/lib/phone";

describe("buildE164", () => {
  it("joins country code and national digits", () => {
    expect(buildE164("+234", "8012345678")).toBe("+2348012345678");
  });

  it("strips the leading zero Nigerians type by habit", () => {
    expect(buildE164("+234", "08012345678")).toBe("+2348012345678");
  });

  it("strips a retyped country code when keeping it would overflow E.164", () => {
    // The live 23 Sep 2026 signup failure: +234 selected AND typed in full.
    expect(buildE164("+234", "2347061294574")).toBe("+2347061294574");
  });

  it("keeps code-looking digits when the number fits E.164 as typed", () => {
    // A US number starting with 1's digits must not be mangled.
    expect(buildE164("+1", "2345678901")).toBe("+12345678901");
  });

  it("ignores stray formatting characters", () => {
    expect(buildE164("+234", "0801 234-5678")).toBe("+2348012345678");
  });
});

describe("isValidE164", () => {
  it("accepts a normal number and rejects an overlong one", () => {
    expect(isValidE164("+2348012345678")).toBe(true);
    expect(isValidE164("+2342347061294574")).toBe(false);
    expect(isValidE164("+2348012")).toBe(true); // 7 digits — the minimum
    expect(isValidE164("+234801")).toBe(false); // 6 digits — one short
  });
});

describe("country codes dataset", () => {
  it("covers the world, uniquely, with well-formed dial codes", async () => {
    const { allCountries } = await import("@/lib/country-codes");
    expect(allCountries.length).toBeGreaterThan(200);
    expect(new Set(allCountries.map((c) => c.iso)).size).toBe(allCountries.length);
    for (const c of allCountries) {
      expect(c.iso).toMatch(/^[A-Z]{2}$/);
      expect(c.dial).toMatch(/^\+[1-9]\d{0,6}$/);
    }
    // Launch market + a shared-code territory + a manual override.
    const by = Object.fromEntries(allCountries.map((c) => [c.iso, c.dial]));
    expect(by.NG).toBe("+234");
    expect(by.JM).toBe("+1876");
    expect(by.VA).toBe("+39");
  });
});
