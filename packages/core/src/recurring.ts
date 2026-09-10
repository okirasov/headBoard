import { type Recur, type Task, newTask } from './model';
import { createdEntry, withHistory } from './history';
import { addDays, startOfDay } from './dates';
import { live } from './tasks';

export const RECUR_OPTIONS: ReadonlyArray<Exclude<Recur, null>> = ['daily', 'weekly', 'monthly'];

/** Next occurrence after `from` (local day arithmetic; monthly clamps to the month's last day). */
export function nextOccurrence(from: number, recur: Exclude<Recur, null>): number {
  const d = new Date(from);
  if (recur === 'daily') return addDays(from, 1);
  if (recur === 'weekly') return addDays(from, 7);
  const day = d.getDate();
  const n = new Date(d.getFullYear(), d.getMonth() + 1, 1, d.getHours(), d.getMinutes());
  const last = new Date(n.getFullYear(), n.getMonth() + 1, 0).getDate();
  n.setDate(Math.min(day, last));
  return n.getTime();
}

/**
 * Next due for a recurring task: advances from its due date until it is after today
 * (so a task overdue by several periods jumps to the next future slot), or from today when undated.
 */
export function nextDueAfterCompletion(task: Task, now: number): number {
  const recur = task.recur as Exclude<Recur, null>;
  const today = startOfDay(now);
  let due = task.due ?? now;
  do { due = nextOccurrence(due, recur); } while (startOfDay(due) <= today);
  return due;
}

/** Complete a recurring task: the original is closed for history, a fresh instance carries the series on. */
export function rollRecurring(task: Task, now: number): { done: Task; next: Task } {
  const seriesId = task.seriesId ?? task.id;
  const done: Task = withHistory(task, { ...task, seriesId, status: 'done', doneAt: now, touched: now }, now);
  const next = newTask({
    history: [createdEntry(now, 'recur')],
    seriesId,
    title: task.title, proj: task.proj, pr: task.pr, status: task.status === 'done' ? 'inbox' : task.status,
    due: nextDueAfterCompletion(task, now), recur: task.recur, tags: task.tags, note: task.note, chat: task.chat,
    remindDays: task.remindDays, created: now, touched: now,
  }, now);
  return { done, next };
}

/** Open recurring tasks, soonest due first. */
export function recurringTasks(tasks: Task[]): Task[] {
  return live(tasks).filter(t => t.recur !== null && t.status !== 'done').sort((a, b) => (a.due ?? Infinity) - (b.due ?? Infinity) || a.pr - b.pr);
}

/**
 * Completed instances of a series, newest first. Linked by `seriesId`; instances created before
 * series ids existed fall back to the old rule (same title + recurrence).
 */
export function seriesHistory(tasks: Task[], task: Task): Task[] {
  const sid = task.seriesId ?? null;
  const same = (t: Task) => (sid ? t.seriesId === sid : !t.seriesId && t.recur === task.recur && t.title === task.title);
  return tasks.filter(t => t.id !== task.id && t.status === 'done' && same(t)).sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0));
}
