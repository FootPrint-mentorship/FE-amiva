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

export function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Lagos";
  } catch {
    return "Africa/Lagos";
  }
}
