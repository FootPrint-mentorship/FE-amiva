/**
 * In-memory fake of src/lib/api/client.ts — the tests' backend.
 * setup.tsx installs it with vi.mock("@/lib/api/client", …), so every
 * repository in src/lib/data/* talks to this module instead of fetch().
 *
 * It honours the real backend's contract (AMIVA-BACKEND-SPEC §5 /
 * openapi.yaml): list endpoints answer with the {data, next_cursor,
 * total_estimate} envelope, GET /calendar/events answers with a bare array,
 * the subtask endpoints answer with the SUBTASK object (not the task), and
 * DELETEs answer 204/undefined.
 */

import {
  makeDb,
  type FakeDb,
  RRULE_HUMAN,
  CANNED_ASSISTANT_REPLY,
  iso,
  type ApiUser,
} from "./fixtures";

/* ----------------------- the client module's surface ---------------------- */

/** Identical to the real ApiError (the real module is mocked away, so the
 * class is redeclared here; runtime `instanceof ApiError` checks resolve to
 * this class everywhere in tests). */
export class ApiError extends Error {
  code: string;
  status: number;
  details?: Record<string, unknown>;
  constructor(code: string, message: string, status: number, details?: Record<string, unknown>) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export type Page<T> = { data: T[]; next_cursor: string | null; total_estimate: number };

let sessionFlag = true;

export function setTokens(_access: string, _refresh: string) {
  sessionFlag = true;
}

export function clearTokens() {
  sessionFlag = false;
}

export function hasSession(): boolean {
  return sessionFlag;
}

/* ------------------------------- fake state ------------------------------- */

export let db: FakeDb = makeDb();

let idSeq = 100;
const nextId = (prefix: string) => `${prefix}_${idSeq++}`;

/** Phone number waiting for OTP verification (POST /auth/phone/send-code). */
let pendingPhone: string | null = null;

/** Restore the pristine fixture database + a live session. */
export function reset() {
  db = makeDb();
  sessionFlag = true;
  pendingPhone = null;
  idSeq = 100;
}

/** Tests can flip the session off (e.g. signed-out flows). */
export function setSession(on: boolean) {
  sessionFlag = on;
}

/* -------------------------------- helpers -------------------------------- */

const page = <T,>(rows: T[]): Page<T> => ({
  data: [...rows],
  next_cursor: null,
  total_estimate: rows.length,
});

const notFound = (what: string): never => {
  throw new ApiError("NOT_FOUND", `${what} not found`, 404);
};

type Body = Record<string, unknown>;

const asBody = (body: unknown): Body => (body ?? {}) as Body;

const sixDigits = (code: unknown) => typeof code === "string" && /^\d{6}$/.test(code);

/** Advance a recurring reminder's next fire (POST /reminders/{id}/skip). */
function advance(isoStr: string, rrule: string | null): string {
  const d = new Date(isoStr);
  if (rrule?.includes("FREQ=DAILY")) d.setDate(d.getDate() + 1);
  else if (rrule?.includes("FREQ=WEEKLY")) d.setDate(d.getDate() + 7);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

function attendeesFromBody(list: unknown): { email: string; name: string; response_status: string }[] {
  if (!Array.isArray(list)) return [];
  return list.map((email) => ({
    email: String(email),
    name: String(email).split("@")[0],
    response_status: "needsAction",
  }));
}

const tokenResponse = (user: ApiUser) => ({
  access_token: "fake-access-token",
  refresh_token: "fake-refresh-token",
  expires_in: 900,
  user,
});

/** The canned POST /search behaviour ported from the retired mock —
 * answers keyed on keywords, honest not-found otherwise. Shaped like the
 * real ApiSearchResponse (plural source types, ISO dates, source ids). */
function searchCanned(q: string) {
  const needle = q.toLowerCase();
  if (needle.includes("landlord") || needle.includes("rent")) {
    return {
      answer:
        "Your landlord's account is GTB 0123456789 (Musa Ibrahim). Rent is due on the last Friday of every month. Your next reminder is set for Fri 31 Jul, 9:00 AM.",
      confidence: "high" as const,
      citations: [
        {
          source_type: "memories",
          source_id: "mem_01",
          title: "Landlord's account",
          snippet: "GTB 0123456789, Musa Ibrahim. Rent due last Friday…",
          date: iso(9, 12, -6),
        },
      ],
      not_found: false,
    };
  }
  if (needle.includes("flight") || needle.includes("nairobi")) {
    return {
      answer:
        "Your Lagos → Nairobi flight is KQ533 on the day after tomorrow, departing 9:15 AM from MMA Terminal 1. You're staying at Sarova Stanley (ref 6HJQZP); James is picking you up.",
      confidence: "high" as const,
      citations: [
        {
          source_type: "calendar",
          source_id: "evt_06",
          title: "Flight to Nairobi (KQ533)",
          snippet: "9:15 AM · MMA Terminal 1",
          date: iso(9, 15, 3),
        },
        {
          source_type: "memories",
          source_id: "mem_05",
          title: "Nairobi trip",
          snippet: "Sarova Stanley, booking ref 6HJQZP. Airport pickup…",
          date: iso(12, 0, -2),
        },
      ],
      not_found: false,
    };
  }
  if (needle.includes("kemi")) {
    return {
      answer:
        "The proposal for Kemi is due today (task, high priority, 1 of 2 subtasks done). Note: Kemi prefers WhatsApp voice notes for quick updates; formal documents by email.",
      confidence: "medium" as const,
      citations: [
        {
          source_type: "tasks",
          source_id: "tsk_01",
          title: "Send proposal to Kemi",
          snippet: "Due today · high priority",
          date: iso(0, 0),
        },
        {
          source_type: "memories",
          source_id: "mem_04",
          title: "Kemi's preferences",
          snippet: "Prefers WhatsApp voice notes over email…",
          date: iso(15, 30, -3),
        },
      ],
      not_found: false,
    };
  }
  return {
    answer:
      "I couldn't find that in your connected sources (memories, calendar and tasks were searched).",
    confidence: "low" as const,
    citations: [],
    not_found: true,
  };
}

/* --------------------------------- router --------------------------------- */

export async function api<T>(
  path: string,
  init?: { method?: string; body?: unknown; auth?: boolean }
): Promise<T> {
  const method = init?.method ?? "GET";
  const body = asBody(init?.body);
  const [pathname, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  const seg = pathname.split("/").filter(Boolean);
  const route = `${method} /${seg.join("/")}`;

  const handle = (): unknown => {
    /* ------------------------------- auth ------------------------------- */
    if (route === "POST /auth/email/send-code") return {};
    if (route === "POST /auth/email/verify") {
      if (!sixDigits(body.code)) throw new ApiError("VALIDATION_ERROR", "Invalid code", 422);
      return {};
    }
    if (route === "POST /auth/register") {
      db.user = {
        ...db.user,
        name: String(body.name ?? db.user.name),
        email: String(body.email ?? db.user.email),
        phone: typeof body.phone === "string" ? body.phone : null,
        preferred_name: String(body.name ?? db.user.name).split(" ")[0],
        timezone: String(body.timezone ?? db.user.timezone),
        phone_verified: false,
        whatsapp_linked: false,
        profile_complete: true,
      };
      return tokenResponse(db.user);
    }
    if (route === "POST /auth/login") return tokenResponse(db.user);
    if (route === "POST /auth/google")
      return { ...tokenResponse(db.user), profile_complete: db.user.profile_complete };
    if (route === "POST /auth/complete-profile") {
      db.user = {
        ...db.user,
        phone: typeof body.phone === "string" ? body.phone : db.user.phone,
        preferred_name:
          typeof body.preferred_name === "string" ? body.preferred_name : db.user.preferred_name,
        timezone: typeof body.timezone === "string" ? body.timezone : db.user.timezone,
        profile_complete: true,
      };
      return db.user;
    }
    if (route === "POST /auth/logout") return undefined;
    if (route === "GET /auth/sessions") return { data: db.sessions };
    if (method === "DELETE" && seg[0] === "auth" && seg[1] === "sessions") {
      db.sessions = db.sessions.filter((s) => s.id !== seg[2]);
      return undefined;
    }
    if (route === "POST /auth/password/forgot") return {};
    if (route === "POST /auth/password/reset") return {};
    if (route === "POST /auth/password/set") return { set: true };
    if (route === "POST /auth/phone/send-code") {
      pendingPhone = typeof body.phone === "string" ? body.phone : null;
      return {};
    }
    if (route === "POST /auth/phone/verify") {
      if (!sixDigits(body.code)) throw new ApiError("VALIDATION_ERROR", "Invalid code", 422);
      if (pendingPhone) db.user.phone = pendingPhone;
      db.user.phone_verified = true;
      pendingPhone = null;
      return { phone: db.user.phone, phone_verified: true };
    }

    /* ------------------------------- users ------------------------------- */
    if (route === "GET /users/me") return db.user;
    if (route === "PATCH /users/me") {
      db.user = {
        ...db.user,
        name: typeof body.name === "string" ? body.name : db.user.name,
        preferred_name:
          typeof body.preferred_name === "string" ? body.preferred_name : db.user.preferred_name,
        timezone: typeof body.timezone === "string" ? body.timezone : db.user.timezone,
      };
      return db.user;
    }
    if (route === "PATCH /users/me/features") {
      db.user.features = { ...db.user.features, ...(body as Record<string, boolean>) };
      return db.user.features;
    }
    if (route === "GET /users/me/preferences/notifications") return db.prefs;
    if (route === "PUT /users/me/preferences/notifications") {
      db.prefs = { ...db.prefs, ...(body as Partial<FakeDb["prefs"]>) };
      return db.prefs;
    }

    /* ----------------------------- reminders ----------------------------- */
    if (route === "GET /reminders") return page(db.reminders);
    if (route === "POST /reminders") {
      const rrule = typeof body.rrule === "string" ? body.rrule : null;
      const dueAt = String(body.due_at ?? new Date().toISOString());
      const created: FakeDb["reminders"][number] = {
        id: nextId("rem"),
        title: String(body.title ?? ""),
        notes: typeof body.notes === "string" ? body.notes : null,
        due_at: dueAt,
        timezone: String(body.timezone ?? db.user.timezone),
        rrule,
        // The server computes the human recurrence text — the fake knows the
        // fixture rules; anything else is honestly null.
        recurrence_human: rrule ? (RRULE_HUMAN[rrule] ?? null) : null,
        channels: Array.isArray(body.channels)
          ? (body.channels as FakeDb["reminders"][number]["channels"])
          : ["whatsapp"],
        status: "scheduled",
        snoozed_until: null,
        next_fire_at: dueAt,
        source: "web",
      };
      db.reminders.push(created);
      return created;
    }
    if (seg[0] === "reminders" && seg[1]) {
      const r = db.reminders.find((x) => x.id === seg[1]) ?? notFound("Reminder");
      if (route === `POST /reminders/${r.id}/complete`) {
        r.status = "completed";
        r.next_fire_at = null;
        return { ...r };
      }
      if (route === `POST /reminders/${r.id}/snooze`) {
        const until = String(body.until ?? new Date().toISOString());
        r.status = "snoozed";
        r.snoozed_until = until;
        r.next_fire_at = until;
        return { ...r };
      }
      if (route === `POST /reminders/${r.id}/skip`) {
        if (r.next_fire_at) r.next_fire_at = advance(r.next_fire_at, r.rrule);
        return { ...r };
      }
      if (route === `PATCH /reminders/${r.id}`) {
        if (typeof body.title === "string") r.title = body.title;
        if ("notes" in body) r.notes = (body.notes as string | null) ?? null;
        if (typeof body.due_at === "string") {
          r.due_at = body.due_at;
          r.next_fire_at = body.due_at;
        }
        if (typeof body.timezone === "string") r.timezone = body.timezone;
        if ("rrule" in body) {
          r.rrule = (body.rrule as string | null) ?? null;
          r.recurrence_human = r.rrule ? (RRULE_HUMAN[r.rrule] ?? null) : null;
        }
        if (Array.isArray(body.channels))
          r.channels = body.channels as FakeDb["reminders"][number]["channels"];
        if (typeof body.status === "string")
          r.status = body.status as FakeDb["reminders"][number]["status"];
        return { ...r };
      }
      if (route === `DELETE /reminders/${r.id}`) {
        db.reminders = db.reminders.filter((x) => x.id !== r.id);
        return undefined;
      }
    }

    /* ------------------------------- tasks ------------------------------- */
    if (route === "GET /tasks") return page(db.tasks);
    if (route === "POST /tasks") {
      const created: FakeDb["tasks"][number] = {
        id: nextId("tsk"),
        title: String(body.title ?? ""),
        due_date: typeof body.due_date === "string" ? body.due_date : null,
        priority: (body.priority as FakeDb["tasks"][number]["priority"]) ?? "medium",
        status: "open",
        project: typeof body.project === "string" ? body.project : null,
        category: typeof body.category === "string" ? body.category : null,
        subtasks: [],
      };
      db.tasks.push(created);
      return created;
    }
    if (seg[0] === "tasks" && seg[1]) {
      const t = db.tasks.find((x) => x.id === seg[1]) ?? notFound("Task");
      if (route === `POST /tasks/${t.id}/complete`) {
        t.status = "completed";
        return { ...t };
      }
      if (route === `POST /tasks/${t.id}/reopen`) {
        t.status = "open";
        return { ...t };
      }
      if (route === `POST /tasks/${t.id}/suggest-subtasks`) {
        return {
          suggestions: [
            `Outline what “${t.title.toLowerCase()}” needs`,
            "Draft the first version",
            "Review and send",
          ],
        };
      }
      // Contract: subtask endpoints return the SUBTASK object, not the task.
      if (route === `POST /tasks/${t.id}/subtasks`) {
        const sub = { id: nextId("sub"), title: String(body.title ?? ""), completed: false };
        t.subtasks.push(sub);
        return { ...sub };
      }
      if (method === "PATCH" && seg[2] === "subtasks" && seg[3]) {
        const sub = t.subtasks.find((s) => s.id === seg[3]) ?? notFound("Subtask");
        if (typeof body.completed === "boolean") sub.completed = body.completed;
        if (typeof body.title === "string") sub.title = body.title;
        return { ...sub };
      }
      if (route === `PATCH /tasks/${t.id}`) {
        Object.assign(t, body);
        return { ...t };
      }
      if (route === `DELETE /tasks/${t.id}`) {
        db.tasks = db.tasks.filter((x) => x.id !== t.id);
        return undefined;
      }
    }

    /* ------------------------------ memories ------------------------------ */
    if (route === "GET /memories") return page(db.memories);
    if (route === "POST /memories") {
      const created: FakeDb["memories"][number] = {
        id: nextId("mem"),
        content: String(body.content ?? ""),
        category: (body.category as FakeDb["memories"][number]["category"]) ?? "other",
        tags: [],
        source_channel: "web",
        favorite: false,
        archived: false,
        created_at: new Date().toISOString(),
      };
      db.memories.push(created);
      return created;
    }
    if (seg[0] === "memories" && seg[1]) {
      const m = db.memories.find((x) => x.id === seg[1]) ?? notFound("Memory");
      if (method === "PATCH") {
        Object.assign(m, body);
        return { ...m };
      }
      if (method === "DELETE") {
        db.memories = db.memories.filter((x) => x.id !== m.id);
        return undefined;
      }
    }

    /* ------------------------------ calendar ------------------------------ */
    // NB: per openapi.yaml this GET answers with a BARE ARRAY, no envelope.
    if (route === "GET /calendar/events") return [...db.weekEvents];
    if (route === "POST /calendar/events") {
      const created: FakeDb["weekEvents"][number] = {
        id: nextId("evt"),
        title: String(body.title ?? ""),
        start_at: String(body.start_at ?? new Date().toISOString()),
        end_at: String(body.end_at ?? new Date().toISOString()),
        all_day: false,
        location: typeof body.location === "string" ? body.location : null,
        conference_url: body.conference ? "https://meet.google.com/fake" : null,
        attendees: attendeesFromBody(body.attendees),
        status: "confirmed",
      };
      db.weekEvents.push(created);
      return created;
    }
    if (seg[0] === "calendar" && seg[1] === "events" && seg[2]) {
      const e = db.weekEvents.find((x) => x.id === seg[2]) ?? notFound("Event");
      if (method === "PATCH") {
        if (typeof body.title === "string") e.title = body.title;
        if (typeof body.start_at === "string") e.start_at = body.start_at;
        if (typeof body.end_at === "string") e.end_at = body.end_at;
        if ("location" in body) e.location = (body.location as string | null) ?? null;
        if (Array.isArray(body.attendees)) e.attendees = attendeesFromBody(body.attendees);
        if ("conference" in body)
          e.conference_url = body.conference
            ? (e.conference_url ?? "https://meet.google.com/fake")
            : null;
        return { ...e };
      }
      if (method === "DELETE") {
        e.status = "cancelled";
        return undefined;
      }
    }

    /* ------------------------------ assistant ------------------------------ */
    if (route === "GET /assistant/messages") {
      // Newest first, in the API's message shape.
      const rows = [...db.chat].reverse().map((m) => ({
        id: m.id,
        role: m.role,
        direction: m.role === "user" ? "inbound" : "outbound",
        text: m.text,
        intent: null,
        created_at: m.at,
      }));
      return page(rows);
    }
    if (route === "POST /assistant/messages") {
      const now = new Date().toISOString();
      db.chat.push(
        { id: nextId("msg"), role: "user", text: String(body.text ?? ""), at: now },
        { id: nextId("msg"), role: "assistant", text: CANNED_ASSISTANT_REPLY, at: now }
      );
      return { reply: CANNED_ASSISTANT_REPLY, actions_taken: [], pending_confirmation: null };
    }
    if (route === "GET /assistant/confirmations") {
      const wanted = params.get("status") ?? "pending";
      const rows = db.confirmations
        .filter((c) => c.status === wanted)
        .map((c) => ({
          id: c.id,
          action_type: c.action_type,
          summary: c.summary,
          risk: c.risk,
          channel: "whatsapp",
          status: c.status,
          expires_at: c.expires_at,
          created_at: iso(9, 42),
        }));
      return page(rows);
    }
    if (seg[0] === "assistant" && seg[1] === "confirmations" && seg[2] && seg[3]) {
      const c = db.confirmations.find((x) => x.id === seg[2]) ?? notFound("Confirmation");
      if (seg[3] === "approve") {
        c.status = "approved";
        return { result: "ok", resource: null, reply: "Approved. Amiva is on it." };
      }
      if (seg[3] === "reject") {
        c.status = "rejected";
        return { result: "ok", resource: null, reply: "Rejected. Nothing was changed." };
      }
    }

    /* ---------------------------- notifications ---------------------------- */
    if (route === "GET /notifications") return page(db.notifications);
    if (route === "POST /notifications/read") {
      const now = new Date().toISOString();
      const ids = Array.isArray(body.ids) ? (body.ids as string[]) : null;
      for (const n of db.notifications) {
        if (body.all === true || ids?.includes(n.id)) n.read_at = now;
      }
      return {};
    }

    /* ----------------------------- integrations ---------------------------- */
    if (route === "GET /integrations") return [...db.integrations];
    if (route === "POST /integrations/google/authorize")
      return { authorization_url: "https://accounts.google.com/o/oauth2/v2/auth?fake=1" };
    if (method === "DELETE" && seg[0] === "integrations" && seg[1]) {
      db.integrations = db.integrations.filter((i) => i.id !== seg[1]);
      return undefined;
    }

    /* ------------------------------- privacy ------------------------------- */
    if (route === "GET /privacy/overview") {
      return {
        data_categories: [
          { kind: "reminders", count: db.reminders.length },
          { kind: "tasks", count: db.tasks.length },
          { kind: "memories", count: db.memories.length },
          { kind: "events", count: db.weekEvents.length },
        ],
      };
    }
    if (route === "POST /privacy/export") return { job_id: "exp_01" };
    if (method === "GET" && seg[0] === "privacy" && seg[1] === "export" && seg[2])
      return { status: "ready", download_url: "/api/v1/privacy/export/exp_01/download" };
    if (route === "DELETE /account") {
      const d = new Date();
      d.setDate(d.getDate() + 14);
      return { status: "scheduled", hard_delete_after: d.toISOString() };
    }

    /* -------------------------------- linking ------------------------------ */
    if (route === "POST /link/whatsapp/verify") {
      db.user.whatsapp_linked = true;
      return {};
    }

    /* ------------------------------- activity ------------------------------ */
    if (route === "GET /activity") return page(db.audit);

    /* -------------------------------- search ------------------------------- */
    if (route === "POST /search") return searchCanned(String(body.query ?? ""));

    throw new ApiError("NOT_FOUND", `No fake route for ${route}`, 404);
  };

  // Deep-copy every response: the db must never share object references
  // with the query cache, or an in-place db mutation would make the cache's
  // "old" data deep-equal to the server's response and TanStack's structural
  // sharing would swallow the update (no re-render).
  const result = handle();
  return (result === undefined ? undefined : structuredClone(result)) as T;
}

/** Authenticated binary GET — the export download in tests. */
export async function apiBlob(_path: string): Promise<Blob> {
  return new Blob([JSON.stringify({ export: "fake" })], { type: "application/json" });
}
