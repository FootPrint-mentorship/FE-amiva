/**
 * Collection repositories on the TanStack Query cache. Screens render from
 * the `useReminders`/`useTasks`/… hooks; every mutation goes to the backend
 * first and the cache is updated from the server's response
 * (server-authoritative). Tests fake the api() boundary.
 */

import { api, Page } from "@/lib/api/client";
import {
  qk,
  queryClient,
  useCollection,
  upsertInList,
  removeFromList,
  patchInList,
} from "@/lib/query";
import { settingsStore } from "@/lib/stores";
import type { Reminder, Task, Memory, CalendarEvent } from "@/lib/types";

/* ------------------------------ hydration ------------------------------ */

function isoDaysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

const fetchReminders = async () =>
  (await api<Page<Reminder>>("/reminders?limit=50")).data;
const fetchTasks = async () => (await api<Page<Task>>("/tasks?limit=50")).data;
const fetchMemories = async () =>
  (await api<Page<Memory>>("/memories?limit=50")).data;
// NB: per openapi.yaml this endpoint returns a bare array, not the list envelope
const fetchEvents = () =>
  api<CalendarEvent[]>(
    `/calendar/events?from=${isoDaysFromNow(-7)}&to=${isoDaysFromNow(30)}`
  );

/** Warm every collection cache once authed (app layout). fetchQuery — not
 * prefetchQuery — so a dead backend still rejects into the layout's toast. */
export async function hydrateAll(): Promise<void> {
  await Promise.all([
    queryClient.fetchQuery({ queryKey: qk.reminders, queryFn: fetchReminders }),
    queryClient.fetchQuery({ queryKey: qk.tasks, queryFn: fetchTasks }),
    queryClient.fetchQuery({ queryKey: qk.memories, queryFn: fetchMemories }),
    // calendar may be unconnected; keep the rest
    queryClient
      .fetchQuery({ queryKey: qk.events, queryFn: fetchEvents })
      .catch(() => null),
  ]);
}

/** Mark every collection stale and refetch what's on screen — called after
 * the assistant reports server-side changes (replaces the old re-hydration). */
export function invalidateCollections(): Promise<void> {
  return Promise.all(
    [qk.reminders, qk.tasks, qk.memories, qk.events].map((queryKey) =>
      queryClient.invalidateQueries({ queryKey })
    )
  ).then(() => undefined);
}

/* ------------------------------ reminders ------------------------------ */

export function useReminders() {
  return useCollection<Reminder>(qk.reminders, fetchReminders);
}

function upsertReminder(r: Reminder) {
  upsertInList(qk.reminders, r);
}

export async function saveReminder(r: Reminder, isNew: boolean): Promise<void> {
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
  upsertReminder(await api<Reminder>(`/reminders/${id}/complete`, { method: "POST" }));
}

export async function snoozeReminder(id: string, until: Date): Promise<void> {
  upsertReminder(
    await api<Reminder>(`/reminders/${id}/snooze`, {
      method: "POST",
      body: { until: until.toISOString() },
    })
  );
}

export async function skipReminder(id: string): Promise<Reminder | null> {
  const saved = await api<Reminder>(`/reminders/${id}/skip`, { method: "POST" });
  upsertReminder(saved);
  return saved;
}

export async function toggleReminderPause(id: string, pause: boolean): Promise<void> {
  upsertReminder(
    await api<Reminder>(`/reminders/${id}`, {
      method: "PATCH",
      body: { status: pause ? "paused" : "scheduled" },
    })
  );
}

export async function deleteReminder(id: string): Promise<void> {
  await api(`/reminders/${id}`, { method: "DELETE" });
  removeFromList<Reminder>(qk.reminders, id);
}

/* -------------------------------- tasks -------------------------------- */

export function useTasks() {
  return useCollection<Task>(qk.tasks, fetchTasks);
}

function upsertTask(t: Task) {
  upsertInList(qk.tasks, t);
}

export async function createTask(t: Omit<Task, "id"> & { id?: string }): Promise<void> {
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
  upsertTask(await api<Task>(`/tasks/${id}`, { method: "PATCH", body: changes }));
}

export async function setTaskStatus(id: string, status: Task["status"]): Promise<void> {
  upsertTask(
    await api<Task>(`/tasks/${id}/${status === "completed" ? "complete" : "reopen"}`, {
      method: "POST",
    })
  );
}

type Subtask = Task["subtasks"][number];

/** Merge one server-confirmed subtask into the cached task. */
function reconcileSubtask(taskId: string, sub: Subtask) {
  patchInList<Task>(qk.tasks, taskId, (t) => ({
    ...t,
    subtasks: t.subtasks.map((s) => (s.id === sub.id ? { ...s, ...sub } : s)),
  }));
}

/** Optimistic: the checkbox flips instantly; the server response (or a
 * rollback on failure) reconciles. Ticking a subtask must never feel hung.
 * Contract check (16 Aug 2026, found live): the subtask endpoints return the
 * SubtaskOut object, NOT the parent task — upserting the response as a Task
 * silently corrupted the list. */
export async function toggleSubtask(task: Task, subId: string): Promise<void> {
  const flipped = task.subtasks.map((s) =>
    s.id === subId ? { ...s, completed: !s.completed } : s
  );
  patchInList<Task>(qk.tasks, task.id, { subtasks: flipped });
  const sub = flipped.find((s) => s.id === subId)!;
  try {
    reconcileSubtask(
      task.id,
      await api<Subtask>(`/tasks/${task.id}/subtasks/${subId}`, {
        method: "PATCH",
        body: { completed: sub.completed },
      })
    );
  } catch (err) {
    // Roll the optimistic flip back — the screen must not lie.
    patchInList<Task>(qk.tasks, task.id, { subtasks: task.subtasks });
    throw err;
  }
}

/** Ideas for breaking a task down (backend LLM; 502 PROVIDER_ERROR without a
 * key). Already-present titles are filtered out. */
export async function suggestSubtaskIdeas(task: Task): Promise<string[]> {
  const res = await api<{ suggestions: string[] }>(
    `/tasks/${task.id}/suggest-subtasks`,
    { method: "POST" }
  );
  return res.suggestions.filter(
    (title) => !task.subtasks.some((s) => s.title === title)
  );
}

export async function addSubtasks(task: Task, titles: string[]): Promise<void> {
  // POST returns the created SubtaskOut — append each into the cached task
  // as it lands, so suggestions appear one by one instead of all-or-nothing.
  for (const title of titles) {
    const sub = await api<Subtask>(`/tasks/${task.id}/subtasks`, {
      method: "POST",
      body: { title },
    });
    patchInList<Task>(qk.tasks, task.id, (t) => ({
      ...t,
      subtasks: [...t.subtasks, sub],
    }));
  }
}

/* ------------------------------- memories ------------------------------ */

export function useMemories() {
  return useCollection<Memory>(qk.memories, fetchMemories);
}

function upsertMemory(m: Memory) {
  upsertInList(qk.memories, m);
}

export async function createMemory(content: string, category: Memory["category"] | null): Promise<void> {
  upsertMemory(
    await api<Memory>("/memories", {
      method: "POST",
      body: { content, ...(category ? { category } : {}) },
    })
  );
}

export async function patchMemory(id: string, changes: Partial<Memory>): Promise<void> {
  upsertMemory(await api<Memory>(`/memories/${id}`, { method: "PATCH", body: changes }));
}

export async function deleteMemoryForever(id: string): Promise<void> {
  await api(`/memories/${id}`, { method: "DELETE", body: { confirm: true } });
  removeFromList<Memory>(qk.memories, id);
}

/* -------------------------------- events ------------------------------- */

export function useEvents() {
  return useCollection<CalendarEvent>(qk.events, fetchEvents);
}

function upsertEvent(e: CalendarEvent) {
  upsertInList(qk.events, e, { append: true });
}

export async function saveEvent(e: CalendarEvent, isNew: boolean): Promise<void> {
  // Contract check (16 Aug 2026, found via a live 422): EventCreate REQUIRES
  // `timezone`, and `attendees` is a list of plain email strings — not
  // {email} objects. PATCH takes the same shapes, optional.
  const body = {
    title: e.title,
    start_at: e.start_at,
    end_at: e.end_at,
    // The modal's time inputs are in the user's zone — send that zone.
    timezone: settingsStore.get().timezone,
    location: e.location,
    attendees: e.attendees.map((a) => a.email),
    conference: !!e.conference_url,
  };
  const saved = isNew
    ? await api<CalendarEvent>("/calendar/events", { method: "POST", body })
    : await api<CalendarEvent>(`/calendar/events/${e.id}`, { method: "PATCH", body });
  upsertEvent(saved);
}

export async function cancelEvent(id: string): Promise<void> {
  await api(`/calendar/events/${id}`, {
    method: "DELETE",
    body: { notify_attendees: true },
  });
  patchInList<CalendarEvent>(qk.events, id, { status: "cancelled" });
}
