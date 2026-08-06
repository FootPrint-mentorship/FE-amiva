import type { SelectOption } from "@/components/ui/select";

/**
 * Comprehensive IANA timezone list for the frontend. No endpoint needed:
 * Intl.supportedValuesOf ships every zone with the browser. The backend
 * still exposes GET /meta/timezones for clients without this API.
 */

const FALLBACK = [
  "Africa/Lagos",
  "Africa/Nairobi",
  "Africa/Accra",
  "Africa/Johannesburg",
  "Africa/Cairo",
  "Europe/London",
  "America/New_York",
  "Asia/Dubai",
];

export function timezoneNames(): string[] {
  try {
    return Intl.supportedValuesOf("timeZone");
  } catch {
    return FALLBACK;
  }
}

function offsetLabel(tz: string): string {
  try {
    const part = new Intl.DateTimeFormat("en", {
      timeZone: tz,
      timeZoneName: "longOffset",
    })
      .formatToParts(new Date())
      .find((p) => p.type === "timeZoneName")?.value;
    return part?.replace("GMT", "UTC") ?? "";
  } catch {
    return "";
  }
}

let cache: SelectOption[] | null = null;

export function timezoneOptions(): SelectOption[] {
  if (!cache) {
    cache = timezoneNames().map((tz) => ({
      value: tz,
      label: tz.replaceAll("_", " "),
      hint: offsetLabel(tz),
    }));
  }
  return cache;
}

// Intl's "en" locale renders most African zones as "GMT+1"-style offsets
// (their named abbreviations only appear under regional locales like en-NG),
// so the primary-market zones are pinned here; everything else asks Intl.
const KNOWN_ABBR: Record<string, string> = {
  "Africa/Lagos": "WAT",
  "Africa/Accra": "GMT",
  "Africa/Nairobi": "EAT",
  "Africa/Johannesburg": "SAST",
  "Africa/Cairo": "EET",
};

/** Short abbreviation for a zone, e.g. "WAT" for Africa/Lagos. */
export function timezoneAbbr(tz: string): string {
  const known = KNOWN_ABBR[tz];
  if (known) return known;
  try {
    return (
      new Intl.DateTimeFormat("en", { timeZone: tz, timeZoneName: "short" })
        .formatToParts(new Date())
        .find((p) => p.type === "timeZoneName")?.value ?? tz
    );
  } catch {
    return tz;
  }
}

export function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Lagos";
  } catch {
    return "Africa/Lagos";
  }
}
