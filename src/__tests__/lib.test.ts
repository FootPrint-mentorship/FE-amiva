import { describe, it, expect } from "vitest";
import { cn } from "@/lib/cn";
import { fmtDay, fmtTime } from "@/lib/format";
import { WA_LINK } from "@/lib/site";
import {
  makeDb,
  makeReminders,
  makeTasks,
  makeEvents,
  makeWeekEvents,
} from "@/test/fixtures";
import { api } from "@/test/fake-api";
import type { Page } from "@/test/fake-api";
import type { Reminder, Task, CalendarEvent } from "@/lib/types";

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

describe("fixtures mirror the API contract (AMIVA-BACKEND-SPEC §5)", () => {
  const db = makeDb();

  it("all ids are unique within and across collections", () => {
    const ids = [
      ...db.reminders.map((x) => x.id),
      ...db.tasks.map((x) => x.id),
      ...db.weekEvents.map((x) => x.id),
      ...db.memories.map((x) => x.id),
      ...db.audit.map((x) => x.id),
      ...db.chat.map((x) => x.id),
      ...db.confirmations.map((x) => x.id),
      ...db.notifications.map((x) => x.id),
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("ids carry their type prefixes", () => {
    for (const r of db.reminders) expect(r.id).toMatch(/^rem_/);
    for (const t of db.tasks) expect(t.id).toMatch(/^tsk_/);
    for (const e of db.weekEvents) expect(e.id).toMatch(/^evt_/);
    for (const m of db.memories) expect(m.id).toMatch(/^mem_/);
  });

  it("every recurring reminder has a human-readable recurrence (frontend never parses RRULEs)", () => {
    for (const r of db.reminders.filter((r) => r.rrule)) {
      expect(r.recurrence_human, r.id).toBeTruthy();
    }
  });

  it("reminders always have at least one delivery channel", () => {
    for (const r of db.reminders) expect(r.channels.length, r.id).toBeGreaterThan(0);
  });

  it("calendar events end after they start", () => {
    for (const e of db.weekEvents) {
      expect(new Date(e.end_at).getTime(), e.id).toBeGreaterThan(
        new Date(e.start_at).getTime()
      );
    }
  });

  it("today's events are a subset of the week's events", () => {
    const weekIds = new Set(makeWeekEvents().map((e) => e.id));
    for (const e of makeEvents()) expect(weekIds.has(e.id), e.id).toBe(true);
  });

  it("former lists live on as categorised checklist tasks", () => {
    const shopping = db.tasks.find((t) => t.title === "Weekly shopping");
    expect(shopping?.category).toBe("Shopping");
    expect(shopping?.subtasks.length).toBeGreaterThan(2);
  });

  it("factories return fresh deep copies — mutating one db never leaks into the next", () => {
    const a = makeReminders();
    a[0].title = "MUTATED";
    a[0].channels.push("email");
    const b = makeReminders();
    expect(b[0].title).toBe("Pay NEPA bill");
    expect(b[0].channels).toEqual(["whatsapp"]);
    const t = makeTasks();
    t[0].subtasks[0].completed = false;
    expect(makeTasks()[0].subtasks[0].completed).toBe(true);
  });
});

describe("fake api honours the backend contract", () => {
  it("list endpoints answer with the {data, next_cursor, total_estimate} envelope", async () => {
    const res = await api<Page<Reminder>>("/reminders?limit=50");
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.next_cursor).toBeNull();
    expect(res.total_estimate).toBe(res.data.length);
  });

  it("GET /calendar/events answers with a bare array, not the envelope", async () => {
    const res = await api<CalendarEvent[]>("/calendar/events?from=a&to=b");
    expect(Array.isArray(res)).toBe(true);
    expect(res.some((e) => e.title === "Team standup")).toBe(true);
  });

  it("subtask endpoints answer with the SUBTASK object, not the parent task", async () => {
    const created = await api<{ id: string; title: string; completed: boolean }>(
      "/tasks/tsk_01/subtasks",
      { method: "POST", body: { title: "New step" } }
    );
    expect(created.title).toBe("New step");
    expect(created.completed).toBe(false);
    expect(created).not.toHaveProperty("subtasks");

    const patched = await api<{ id: string; completed: boolean }>(
      `/tasks/tsk_01/subtasks/${created.id}`,
      { method: "PATCH", body: { completed: true } }
    );
    expect(patched.id).toBe(created.id);
    expect(patched.completed).toBe(true);
    expect(patched).not.toHaveProperty("subtasks");
  });

  it("suggest-subtasks answers the canned three ideas", async () => {
    const res = await api<{ suggestions: string[] }>("/tasks/tsk_02/suggest-subtasks", {
      method: "POST",
    });
    expect(res.suggestions).toEqual([
      "Outline what “review q3 budget draft” needs",
      "Draft the first version",
      "Review and send",
    ]);
  });

  it("the server computes recurrence_human on create — fixture rules resolve, unknown rules stay null", async () => {
    const known = await api<Reminder>("/reminders", {
      method: "POST",
      body: {
        title: "Report",
        due_at: new Date().toISOString(),
        timezone: "Africa/Lagos",
        rrule: "FREQ=WEEKLY;BYDAY=FR",
        channels: ["email"],
      },
    });
    expect(known.recurrence_human).toBe("Every Friday");
    const unknown = await api<Reminder>("/reminders", {
      method: "POST",
      body: {
        title: "Odd rule",
        due_at: new Date().toISOString(),
        timezone: "Africa/Lagos",
        rrule: "FREQ=YEARLY;BYMONTH=2",
        channels: ["email"],
      },
    });
    expect(unknown.recurrence_human).toBeNull();
  });

  it("completing a task answers the whole task; completing a reminder clears next_fire_at", async () => {
    const task = await api<Task>("/tasks/tsk_02/complete", { method: "POST" });
    expect(task.status).toBe("completed");
    const rem = await api<Reminder>("/reminders/rem_01/complete", { method: "POST" });
    expect(rem.status).toBe("completed");
    expect(rem.next_fire_at).toBeNull();
  });
});

describe("site config", () => {
  it("builds a wa.me deep link with a prefilled greeting", () => {
    expect(WA_LINK).toMatch(/^https:\/\/wa\.me\/\d+\?text=/);
    expect(decodeURIComponent(WA_LINK)).toContain("Hi Amiva");
  });
});
