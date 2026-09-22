/** Event recurrence drafting (FE spec §5.4 amendment, 19 Aug 2026).
 *
 * Mirrors the reminders architecture: the UI assembles a plain RFC 5545
 * RRULE string and the backend validates, normalizes and humanizes it —
 * the frontend never *parses* server rules beyond best-effort prefilling
 * of its own simple shapes (an untouched edit keeps the original verbatim,
 * exactly like the reminder modal). UNTIL is sent as a bare YYYYMMDD date;
 * the server converts it to the end of that day in the event's timezone. */

export const repeatKinds = [
  "none",
  "daily",
  "weekly",
  "monthly",
  "yearly",
  "custom",
] as const;
export type RepeatKind = (typeof repeatKinds)[number];
export type CustomUnit = "day" | "week" | "month" | "year";
export type EndsKind = "never" | "on" | "after";

export type RecurrenceDraft = {
  kind: RepeatKind;
  /** Weekly (and custom weeks): RFC weekday codes, e.g. ["MO", "WE"]. */
  byDays: string[];
  /** Custom only: every N units. */
  interval: number;
  unit: CustomUnit;
  ends: EndsKind;
  /** YYYY-MM-DD, when ends === "on". */
  untilDate: string;
  /** Occurrence count, when ends === "after". */
  count: number;
};

export const WEEKDAY_CODES = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"] as const;
const WEEKDAY_NAMES: Record<string, string> = {
  MO: "Monday",
  TU: "Tuesday",
  WE: "Wednesday",
  TH: "Thursday",
  FR: "Friday",
  SA: "Saturday",
  SU: "Sunday",
};
const FREQ_OF: Record<CustomUnit, string> = {
  day: "DAILY",
  week: "WEEKLY",
  month: "MONTHLY",
  year: "YEARLY",
};
const UNIT_OF: Record<string, CustomUnit> = {
  DAILY: "day",
  WEEKLY: "week",
  MONTHLY: "month",
  YEARLY: "year",
};

export function defaultRecurrence(): RecurrenceDraft {
  return {
    kind: "none",
    byDays: ["MO"],
    interval: 2,
    unit: "week",
    ends: "never",
    untilDate: "",
    count: 10,
  };
}

const sortDays = (days: string[]) =>
  [...days].sort(
    (a, b) => WEEKDAY_CODES.indexOf(a as never) - WEEKDAY_CODES.indexOf(b as never),
  );

/** eventDate: the event's YYYY-MM-DD (monthly repeats pin its day-of-month). */
export function buildEventRrule(
  r: RecurrenceDraft,
  eventDate: string,
): string | null {
  if (r.kind === "none") return null;
  const parts: string[] = [];
  if (r.kind === "custom") {
    parts.push(`FREQ=${FREQ_OF[r.unit]}`);
    if (r.interval > 1) parts.push(`INTERVAL=${r.interval}`);
    if (r.unit === "week" && r.byDays.length)
      parts.push(`BYDAY=${sortDays(r.byDays).join(",")}`);
  } else if (r.kind === "daily") {
    parts.push("FREQ=DAILY");
  } else if (r.kind === "weekly") {
    parts.push("FREQ=WEEKLY");
    if (r.byDays.length) parts.push(`BYDAY=${sortDays(r.byDays).join(",")}`);
  } else if (r.kind === "monthly") {
    parts.push(`FREQ=MONTHLY;BYMONTHDAY=${Number(eventDate.slice(8, 10))}`);
  } else {
    parts.push("FREQ=YEARLY");
  }
  if (r.ends === "on" && r.untilDate)
    parts.push(`UNTIL=${r.untilDate.replaceAll("-", "")}`);
  else if (r.ends === "after") parts.push(`COUNT=${r.count}`);
  return parts.join(";");
}

/** Best-effort prefill for editing — covers the shapes this UI builds.
 *  Anything richer stays verbatim via the caller's untouched-check. */
export function parseEventRrule(rrule: string | null): RecurrenceDraft {
  const draft = defaultRecurrence();
  if (!rrule) return draft;
  const parts: Record<string, string> = {};
  for (const chunk of rrule.replace(/^RRULE:/, "").split(";")) {
    const [k, v] = chunk.split("=");
    if (k && v) parts[k.toUpperCase()] = v;
  }
  const unit = UNIT_OF[parts.FREQ ?? ""];
  if (!unit) return draft;
  const interval = Number(parts.INTERVAL ?? "1") || 1;
  if (parts.BYDAY)
    draft.byDays = sortDays(
      parts.BYDAY.split(",").filter((d) => d in WEEKDAY_NAMES),
    );
  if (interval > 1) {
    draft.kind = "custom";
    draft.interval = interval;
    draft.unit = unit;
  } else {
    draft.kind = unit === "day" ? "daily" : (`${unit}ly` as RepeatKind);
  }
  if (parts.COUNT) {
    draft.ends = "after";
    draft.count = Number(parts.COUNT) || 1;
  } else if (parts.UNTIL) {
    draft.ends = "on";
    const d = parts.UNTIL.slice(0, 8);
    draft.untilDate = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
  }
  return draft;
}

/** Modal preview text; the saved event shows the server's recurrence_human. */
export function describeRecurrence(
  r: RecurrenceDraft,
  eventDate: string,
): string | null {
  if (r.kind === "none") return null;
  let base: string;
  if (r.kind === "custom") {
    base =
      r.interval > 1 ? `Every ${r.interval} ${r.unit}s` : `Every ${r.unit}`;
    if (r.unit === "week" && r.byDays.length)
      base += ` on ${sortDays(r.byDays)
        .map((d) => WEEKDAY_NAMES[d])
        .join(", ")}`;
  } else if (r.kind === "daily") {
    base = "Every day";
  } else if (r.kind === "weekly") {
    base = r.byDays.length
      ? `Every ${sortDays(r.byDays)
          .map((d) => WEEKDAY_NAMES[d])
          .join(", ")}`
      : "Every week";
  } else if (r.kind === "monthly") {
    base = `Every month on day ${Number(eventDate.slice(8, 10))}`;
  } else {
    base = "Every year";
  }
  if (r.ends === "on" && r.untilDate) base += `, until ${r.untilDate}`;
  else if (r.ends === "after") base += `, ${r.count} times`;
  return base;
}
