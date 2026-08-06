/**
 * Store-hydrating repositories. Screens keep rendering from the shared
 * stores; in real-API mode every mutation goes to the backend first and the
 * store is updated from the server's response (server-authoritative). In
 * mock mode (NEXT_PUBLIC_USE_MOCKS=1) mutations edit the stores directly —
 * the original self-contained demo behaviour.
 */

import { api, Page, USE_MOCKS } from "@/lib/api/client";
import {
  remindersStore,
  tasksStore,
  memoriesStore,
  eventsStore,
} from "@/lib/stores";
import type { Reminder, Task, Memory, CalendarEvent } from "@/lib/mock";

/* ------------------------------ hydration ------------------------------ */

function isoDaysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export async function hydrateAll(): Promise<void> {
  if (USE_MOCKS) return;
  const [reminders, tasks, memories, events] = await Promise.all([
    api<Page<Reminder>>("/reminders?limit=50"),
    api<Page<Task>>("/tasks?limit=50"),
    api<Page<Memory>>("/memories?limit=50"),
    // NB: per openapi.yaml this endpoint returns a bare array, not the list envelope
    api<CalendarEvent[]>(
      `/calendar/events?from=${isoDaysFromNow(-7)}&to=${isoDaysFromNow(30)}`
    ).catch(() => null), // calendar may be unconnected; keep the rest
  ]);
  remindersStore.set(reminders.data);
  tasksStore.set(tasks.data);
  memoriesStore.set(memories.data);
  if (events) eventsStore.set(events);
}

/* ------------------------------ reminders ------------------------------ */

function upsertReminder(r: Reminder) {
  remindersStore.set((cur) =>
    cur.some((x) => x.id === r.id) ? cur.map((x) => (x.id === r.id ? r : x)) : [r, ...cur]
  );
}

export async function saveReminder(r: Reminder, isNew: boolean): Promise<void> {
  if (USE_MOCKS) return upsertReminder(r);
  const body = {
    title: r.title,
    notes: r.notes,
    due_at: r.due_at,
    timezone: r.timezone,
    rrule: r.rrule,
    channels: r.channels,
  };
  const saved = isNew
    ? await api<Reminder>("/reminders", { method: "POST", body })
    : await api<Reminder>(`/reminders/${r.id}`, { method: "PATCH", body });
  upsertReminder(saved);
}

export async function completeReminder(id: string): Promise<void> {
  if (USE_MOCKS) {
    remindersStore.set((cur) =>
      cur.map((r) => (r.id === id ? { ...r, status: "completed" as const } : r))
    );
    return;
  }
  upsertReminder(await api<Reminder>(`/reminders/${id}/complete`, { method: "POST" }));
}

export async function snoozeReminder(id: string, until: Date): Promise<void> {
  if (USE_MOCKS) {
    remindersStore.set((cur) =>
      cur.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "snoozed" as const,
              snoozed_until: until.toISOString(),
              next_fire_at: until.toISOString(),
            }
          : r
      )
    );
    return;
  }
  upsertReminder(
    await api<Reminder>(`/reminders/${id}/snooze`, {
      method: "POST",
      body: { until: until.toISOString() },
    })
  );
}

export async function skipReminder(id: string, fallbackNext: Date): Promise<Reminder | null> {
  if (USE_MOCKS) {
    let updated: Reminder | null = null;
    remindersStore.set((cur) =>
      cur.map((r) => {
        if (r.id !== id) return r;
        updated = {
          ...r,
          due_at: fallbackNext.toISOString(),
          next_fire_at: fallbackNext.toISOString(),
        };
        return updated;
      })
    );
    return updated;
  }
  const saved = await api<Reminder>(`/reminders/${id}/skip`, { method: "POST" });
  upsertReminder(saved);
  return saved;
}

export async function toggleReminderPause(id: string, pause: boolean): Promise<void> {
  if (USE_MOCKS) {
    remindersStore.set((cur) =>
      cur.map((r) =>
        r.id === id
          ? { ...r, status: (pause ? "paused" : "scheduled") as Reminder["status"] }
          : r
      )
    );
    return;
  }
  upsertReminder(
    await api<Reminder>(`/reminders/${id}`, {
      method: "PATCH",
      body: { status: pause ? "paused" : "scheduled" },
    })
  );
}

export async function deleteReminder(id: string): Promise<void> {
  if (!USE_MOCKS) await api(`/reminders/${id}`, { method: "DELETE" });
  remindersStore.set((cur) => cur.filter((r) => r.id !== id));
}

/* -------------------------------- tasks -------------------------------- */

function upsertTask(t: Task) {
  tasksStore.set((cur) =>
    cur.some((x) => x.id === t.id) ? cur.map((x) => (x.id === t.id ? t : x)) : [t, ...cur]
  );
}

export async function createTask(t: Omit<Task, "id"> & { id?: string }): Promise<void> {
  if (USE_MOCKS) {
    upsertTask({ ...t, id: t.id ?? `tsk_${Date.now()}` } as Task);
    return;
  }
  upsertTask(
    await api<Task>("/tasks", {
      method: "POST",
      body: {
        title: t.title,
        due_date: t.due_date,
        priority: t.priority,
        project: t.project,
        category: t.category,
      },
    })
  );
}

export async function patchTask(id: string, changes: Partial<Task>): Promise<void> {
  if (USE_MOCKS) {
    tasksStore.set((cur) => cur.map((t) => (t.id === id ? { ...t, ...changes } : t)));
    return;
  }
  upsertTask(await api<Task>(`/tasks/${id}`, { method: "PATCH", body: changes }));
}

export async function setTaskStatus(id: string, status: Task["status"]): Promise<void> {
  if (USE_MOCKS) {
    tasksStore.set((cur) => cur.map((t) => (t.id === id ? { ...t, status } : t)));
    return;
  }
  upsertTask(
    await api<Task>(`/tasks/${id}/${status === "completed" ? "complete" : "reopen"}`, {
      method: "POST",
    })
  );
}

export async function toggleSubtask(task: Task, subId: string): Promise<void> {
  const flipped = task.subtasks.map((s) =>
    s.id === subId ? { ...s, completed: !s.completed } : s
  );
  if (USE_MOCKS) {
    tasksStore.set((cur) =>
      cur.map((t) => (t.id === task.id ? { ...t, subtasks: flipped } : t))
    );
    return;
  }
  const sub = flipped.find((s) => s.id === subId)!;
  upsertTask(
    await api<Task>(`/tasks/${task.id}/subtasks/${subId}`, {
      method: "PATCH",
      body: { completed: sub.completed },
    })
  );
}

export async function addSubtasks(task: Task, titles: string[]): Promise<void> {
  if (USE_MOCKS) {
    tasksStore.set((cur) =>
      cur.map((t) =>
        t.id === task.id
          ? {
              ...t,
              subtasks: [
                ...t.subtasks,
                ...titles.map((title, i) => ({
                  id: `sub_${Date.now()}_${i}`,
                  title,
                  completed: false,
                })),
              ],
            }
          : t
      )
    );
    return;
  }
  let latest: Task | null = null;
  for (const title of titles) {
    latest = await api<Task>(`/tasks/${task.id}/subtasks`, {
      method: "POST",
      body: { title },
    });
  }
  if (latest) upsertTask(latest);
}

/* ------------------------------- memories ------------------------------ */

function upsertMemory(m: Memory) {
  memoriesStore.set((cur) =>
    cur.some((x) => x.id === m.id) ? cur.map((x) => (x.id === m.id ? m : x)) : [m, ...cur]
  );
}

export async function createMemory(content: string, category: Memory["category"] | null): Promise<void> {
  if (USE_MOCKS) {
    upsertMemory({
      id: `mem_${Date.now()}`,
      content,
      category: category ?? "other",
      tags: [],
      source_channel: "web",
      favorite: false,
      archived: false,
      created_at: new Date().toISOString(),
    });
    return;
  }
  upsertMemory(
    await api<Memory>("/memories", {
      method: "POST",
      body: { content, ...(category ? { category } : {}) },
    })
  );
}

export async function patchMemory(id: string, changes: Partial<Memory>): Promise<void> {
  if (USE_MOCKS) {
    memoriesStore.set((cur) => cur.map((m) => (m.id === id ? { ...m, ...changes } : m)));
    return;
  }
  upsertMemory(await api<Memory>(`/memories/${id}`, { method: "PATCH", body: changes }));
}

export async function deleteMemoryForever(id: string): Promise<void> {
  if (!USE_MOCKS)
    await api(`/memories/${id}`, { method: "DELETE", body: { confirm: true } });
  memoriesStore.set((cur) => cur.filter((m) => m.id !== id));
}

/* -------------------------------- events ------------------------------- */

function upsertEvent(e: CalendarEvent) {
  eventsStore.set((cur) =>
    cur.some((x) => x.id === e.id) ? cur.map((x) => (x.id === e.id ? e : x)) : [...cur, e]
  );
}

export async function saveEvent(e: CalendarEvent, isNew: boolean): Promise<void> {
  if (USE_MOCKS) {
    if (isNew) eventsStore.set((cur) => [...cur, e]);
    else upsertEvent(e);
    return;
  }
  const body = {
    title: e.title,
    start_at: e.start_at,
    end_at: e.end_at,
    location: e.location,
    attendees: e.attendees.map((a) => ({ email: a.email })),
    conference: !!e.conference_url,
  };
  const saved = isNew
    ? await api<CalendarEvent>("/calendar/events", { method: "POST", body })
    : await api<CalendarEvent>(`/calendar/events/${e.id}`, { method: "PATCH", body });
  upsertEvent(saved);
}

export async function cancelEvent(id: string): Promise<void> {
  if (!USE_MOCKS)
    await api(`/calendar/events/${id}`, {
      method: "DELETE",
      body: { notify_attendees: true },
    });
  eventsStore.set((cur) =>
    cur.map((e) => (e.id === id ? { ...e, status: "cancelled" as const } : e))
  );
}
