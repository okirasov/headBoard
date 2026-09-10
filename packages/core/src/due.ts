import { DAY_MS, type Task } from './model';
import { addDays, startOfDay } from './dates';
import { dueDiff, live } from './tasks';

export type DueGroupKey = 'overdue' | 'today' | 'tomorrow' | 'week' | 'later';
export interface DueGroup { key: DueGroupKey; tasks: Task[] }

/** Open tasks with a due date, bucketed by distance from today; each bucket sorted by due then priority. */
export function dueGroups(tasks: Task[], now: number): DueGroup[] {
  const open = live(tasks).filter(t => t.status !== 'done' && t.due !== null);
  const by: Record<DueGroupKey, Task[]> = { overdue: [], today: [], tomorrow: [], week: [], later: [] };
  for (const t of open) {
    const d = dueDiff(t, now) as number;
    (d < 0 ? by.overdue : d === 0 ? by.today : d === 1 ? by.tomorrow : d < 7 ? by.week : by.later).push(t);
  }
  const cmp = (a: Task, b: Task) => (a.due as number) - (b.due as number) || a.pr - b.pr;
  return (['overdue', 'today', 'tomorrow', 'week', 'later'] as DueGroupKey[]).map(key => ({ key, tasks: by[key].sort(cmp) }));
}

/** Open tasks without a date, most recently touched first (candidates for scheduling). */
export function undated(tasks: Task[]): Task[] {
  return live(tasks).filter(t => t.status !== 'done' && t.due === null).sort((a, b) => b.touched - a.touched);
}

export const REMIND_OPTIONS = [0, 1] as const;
export type RemindDays = (typeof REMIND_OPTIONS)[number];

/**
 * Tasks whose reminder fires on the local day of `now`: due in `remindDays` days
 * (0 = on the due day, 1 = the day before). Overdue tasks are included when their reminder is on.
 */
export function dueReminderTargets(tasks: Task[], now: number): Task[] {
  const today = startOfDay(now);
  return live(tasks)
    .filter(t => t.status !== 'done' && t.due !== null && t.remindDays !== null)
    .filter(t => { const dueDay = startOfDay(t.due as number); return dueDay <= today || dueDay === addDays(today, t.remindDays as number); })
    .sort((a, b) => (a.due as number) - (b.due as number));
}

/** Days until the local due day; negative when overdue. */
export function daysUntil(t: Task, now: number): number | null {
  return t.due === null ? null : Math.round((startOfDay(t.due) - startOfDay(now)) / DAY_MS);
}
