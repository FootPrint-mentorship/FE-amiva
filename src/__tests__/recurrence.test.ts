import { describe, expect, it } from "vitest";
import {
  buildEventRrule,
  defaultRecurrence,
  describeRecurrence,
  parseEventRrule,
  type RecurrenceDraft,
} from "@/lib/recurrence";

const draft = (over: Partial<RecurrenceDraft>): RecurrenceDraft => ({
  ...defaultRecurrence(),
  ...over,
});

describe("buildEventRrule", () => {
  it("returns null for non-repeating", () => {
    expect(buildEventRrule(defaultRecurrence(), "2026-08-24")).toBeNull();
  });

  it("builds the simple frequencies", () => {
    expect(buildEventRrule(draft({ kind: "daily" }), "2026-08-24")).toBe(
      "FREQ=DAILY",
    );
    expect(
      buildEventRrule(draft({ kind: "weekly", byDays: ["WE", "MO"] }), "2026-08-24"),
    ).toBe("FREQ=WEEKLY;BYDAY=MO,WE"); // weekday order normalized
    expect(buildEventRrule(draft({ kind: "monthly" }), "2026-08-15")).toBe(
      "FREQ=MONTHLY;BYMONTHDAY=15",
    );
    expect(buildEventRrule(draft({ kind: "yearly" }), "2026-08-20")).toBe(
      "FREQ=YEARLY",
    );
  });

  it("builds custom intervals", () => {
    expect(
      buildEventRrule(
        draft({ kind: "custom", interval: 2, unit: "week", byDays: ["FR"] }),
        "2026-08-24",
      ),
    ).toBe("FREQ=WEEKLY;INTERVAL=2;BYDAY=FR");
    expect(
      buildEventRrule(draft({ kind: "custom", interval: 3, unit: "month" }), "2026-08-24"),
    ).toBe("FREQ=MONTHLY;INTERVAL=3");
  });

  it("appends end conditions", () => {
    expect(
      buildEventRrule(
        draft({ kind: "daily", ends: "on", untilDate: "2026-12-31" }),
        "2026-08-24",
      ),
    ).toBe("FREQ=DAILY;UNTIL=20261231"); // server converts to UTC datetime
    expect(
      buildEventRrule(draft({ kind: "daily", ends: "after", count: 20 }), "2026-08-24"),
    ).toBe("FREQ=DAILY;COUNT=20");
  });
});

describe("parseEventRrule", () => {
  it("round-trips every shape the builder produces", () => {
    const shapes: RecurrenceDraft[] = [
      draft({ kind: "daily" }),
      draft({ kind: "weekly", byDays: ["MO", "WE"] }),
      draft({ kind: "monthly" }),
      draft({ kind: "yearly" }),
      draft({ kind: "custom", interval: 2, unit: "week", byDays: ["FR"] }),
      draft({ kind: "daily", ends: "after", count: 12 }),
      draft({ kind: "weekly", byDays: ["TU"], ends: "on", untilDate: "2026-12-31" }),
    ];
    for (const shape of shapes) {
      const rrule = buildEventRrule(shape, "2026-08-15");
      const parsed = parseEventRrule(rrule);
      expect(buildEventRrule(parsed, "2026-08-15")).toBe(rrule);
    }
  });

  it("handles server-normalized UNTIL datetimes and prefixes", () => {
    const parsed = parseEventRrule("RRULE:FREQ=DAILY;UNTIL=20261231T225959Z");
    expect(parsed.ends).toBe("on");
    expect(parsed.untilDate).toBe("2026-12-31");
  });

  it("falls back to none for absent or exotic rules", () => {
    expect(parseEventRrule(null).kind).toBe("none");
    expect(parseEventRrule("FREQ=HOURLY").kind).toBe("none");
  });
});

describe("describeRecurrence", () => {
  it("reads naturally", () => {
    expect(
      describeRecurrence(draft({ kind: "weekly", byDays: ["MO", "WE"] }), "2026-08-24"),
    ).toBe("Every Monday, Wednesday");
    expect(
      describeRecurrence(
        draft({ kind: "monthly", ends: "after", count: 6 }),
        "2026-08-15",
      ),
    ).toBe("Every month on day 15, 6 times");
    expect(describeRecurrence(defaultRecurrence(), "2026-08-24")).toBeNull();
  });
});
