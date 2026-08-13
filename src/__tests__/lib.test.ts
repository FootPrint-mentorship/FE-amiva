import { describe, it, expect } from "vitest";
import { cn } from "@/lib/cn";
import {
  fmtDay,
  fmtTime,
  reminders,
  tasks,
  events,
  weekEvents,
  memories,
  auditEvents,
  chatSeed,
  pendingConfirmations,
} from "@/lib/mock";
import { WA_LINK } from "@/lib/site";

describe("cn()", () => {
  it("joins truthy classes and drops falsy ones", () => {
    expect(cn("a", false, undefined, null, "b")).toBe("a b");
  });
  it("returns empty string for no input", () => {
    expect(cn()).toBe("");
  });
});

describe("date helpers", () => {
  it("fmtTime renders 12-hour local time", () => {
    const d = new Date();
    d.setHours(13, 5, 0, 0);
    expect(fmtTime(d.toISOString())).toMatch(/1:05\s?pm/i);
  });

  it("fmtDay labels today / tomorrow / yesterday relative to now", () => {
    const at = (offset: number) => {
      const d = new Date();
      d.setDate(d.getDate() + offset);
      d.setHours(12, 0, 0, 0);
      return d.toISOString();
    };
    expect(fmtDay(at(0))).toBe("Today");
    expect(fmtDay(at(1))).toBe("Tomorrow");
    expect(fmtDay(at(-1))).toBe("Yesterday");
    expect(fmtDay(at(5))).toMatch(/^\w{3} \d{1,2} \w{3}$/); // e.g. "Fri 31 Jul"
  });
});

describe("mock data mirrors the API contract (AMIVA-BACKEND-SPEC §5)", () => {
  it("all ids are unique within and across collections", () => {
    const ids = [
      ...reminders.map((x) => x.id),
      ...tasks.map((x) => x.id),
      ...weekEvents.map((x) => x.id),
      ...memories.map((x) => x.id),
      ...auditEvents.map((x) => x.id),
      ...chatSeed.map((x) => x.id),
      ...pendingConfirmations.map((x) => x.id),
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("ids carry their type prefixes", () => {
    for (const r of reminders) expect(r.id).toMatch(/^rem_/);
    for (const t of tasks) expect(t.id).toMatch(/^tsk_/);
    for (const e of weekEvents) expect(e.id).toMatch(/^evt_/);
    for (const m of memories) expect(m.id).toMatch(/^mem_/);
  });

  it("every recurring reminder has a human-readable recurrence (frontend never parses RRULEs)", () => {
    for (const r of reminders.filter((r) => r.rrule)) {
      expect(r.recurrence_human, r.id).toBeTruthy();
    }
  });

  it("reminders always have at least one delivery channel", () => {
    for (const r of reminders) expect(r.channels.length, r.id).toBeGreaterThan(0);
  });

  it("calendar events end after they start", () => {
    for (const e of weekEvents) {
      expect(new Date(e.end_at).getTime(), e.id).toBeGreaterThan(
        new Date(e.start_at).getTime()
      );
    }
  });

  it("today's events are a subset of the week's events", () => {
    const weekIds = new Set(weekEvents.map((e) => e.id));
    for (const e of events) expect(weekIds.has(e.id), e.id).toBe(true);
  });

  it("former lists live on as categorised checklist tasks", () => {
    const shopping = tasks.find((t) => t.title === "Weekly shopping");
    expect(shopping?.category).toBe("Shopping");
    expect(shopping?.subtasks.length).toBeGreaterThan(2);
  });

  it("audit events carry approval details for high-risk successes", () => {
    for (const a of auditEvents.filter((a) => a.risk === "high" && a.result === "success")) {
      expect(a.approval, a.id).toBeTruthy();
    }
  });
});

describe("site config", () => {
  it("builds a wa.me deep link with a prefilled greeting", () => {
    expect(WA_LINK).toMatch(/^https:\/\/wa\.me\/\d+\?text=/);
    expect(decodeURIComponent(WA_LINK)).toContain("Hi Amiva");
  });
});
