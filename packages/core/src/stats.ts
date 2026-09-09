import { DAY_MS, STALE_DAYS_DEFAULT, type Priority, type Project, type Task } from './model';
import { addDays, startOfDay } from './dates';
import { isStale, live } from './tasks';

/** Monday 00:00 of the week containing `ts` (local time). */
export function startOfWeek(ts: number): number {
  const d = new Date(startOfDay(ts));
  const shift = (d.getDay() + 6) % 7;
  return addDays(d.getTime(), -shift);
}

export interface WeekBucket { start: number; end: number; closed: number; created: number; isCurrent: boolean }

/** Last `weeks` weeks ending with the current one: tasks closed (doneAt) and created per week. */
export function weeklyActivity(tasks: Task[], now: number, weeks = 8): WeekBucket[] {
  const thisWeek = startOfWeek(now);
  const out: WeekBucket[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = addDays(thisWeek, -7 * i);
    const end = addDays(start, 7);
    out.push({
      start, end, isCurrent: i === 0,
      closed: tasks.filter(t => t.doneAt !== null && t.doneAt >= start && t.doneAt < end).length,
      created: tasks.filter(t => t.created >= start && t.created < end).length,
    });
  }
  return out;
}

export interface PriorityMix { counts: Record<Priority, number>; total: number }

/** Open (not done/archived) tasks by priority. */
export function priorityMix(tasks: Task[]): PriorityMix {
  const open = live(tasks).filter(t => t.status !== 'done');
  const counts: Record<Priority, number> = { 0: 0, 1: 0, 2: 0 };
  for (const t of open) counts[t.pr]++;
  return { counts, total: open.length };
}

export interface ProjectLoad { id: string | null; name: string | null; color: string | null; open: number; done: number }

/** Open and done counts per project, largest open first; tasks without a project last. */
export function openByProject(tasks: Task[], projects: Project[]): ProjectLoad[] {
  const lv = live(tasks);
  const rows: ProjectLoad[] = projects.map(p => ({
    id: p.id, name: p.name, color: p.color,
    open: lv.filter(t => t.proj === p.id && t.status !== 'done').length,
    done: lv.filter(t => t.proj === p.id && t.status === 'done').length,
  }));
  const none = { id: null, name: null, color: null, open: lv.filter(t => t.proj === null && t.status !== 'done').length, done: lv.filter(t => t.proj === null && t.status === 'done').length };
  rows.sort((a, b) => b.open - a.open || b.done - a.done);
  if (none.open + none.done > 0) rows.push(none);
  return rows;
}

export const IDLE_BUCKETS = [
  { key: 'fresh', min: 0, max: 1 },
  { key: 'warm', min: 2, max: 6 },
  { key: 'stale', min: 7, max: 13 },
  { key: 'cold', min: 14, max: Infinity },
] as const;
export type IdleBucketKey = (typeof IDLE_BUCKETS)[number]['key'];

/** Open tasks grouped by days since `touched`. */
export function idleBuckets(tasks: Task[], now: number): Array<{ key: IdleBucketKey; count: number }> {
  const open = live(tasks).filter(t => t.status !== 'done');
  return IDLE_BUCKETS.map(b => ({
    key: b.key,
    count: open.filter(t => { const d = Math.floor((now - t.touched) / DAY_MS); return d >= b.min && d <= b.max; }).length,
  }));
}

/** Consecutive days (ending today, or yesterday if nothing closed yet today) with at least one completion. */
export function completionStreak(tasks: Task[], now: number): number {
  const days = new Set(tasks.filter(t => t.doneAt !== null).map(t => startOfDay(t.doneAt as number)));
  let cursor = startOfDay(now);
  if (!days.has(cursor)) cursor = addDays(cursor, -1);
  let n = 0;
  while (days.has(cursor)) { n++; cursor = addDays(cursor, -1); }
  return n;
}

/** Median of (doneAt − created) in days over completed tasks; null when none. */
export function medianDaysToClose(tasks: Task[]): number | null {
  const spans = tasks.filter(t => t.doneAt !== null).map(t => Math.max(0, ((t.doneAt as number) - t.created) / DAY_MS)).sort((a, b) => a - b);
  if (!spans.length) return null;
  const mid = Math.floor(spans.length / 2);
  const m = spans.length % 2 ? spans[mid] : (spans[mid - 1] + spans[mid]) / 2;
  return Math.round(m * 10) / 10;
}

export interface StatsSummary {
  openN: number; closedWeek: number; closedPrevWeek: number; createdWeek: number; staleN: number; streak: number; medianClose: number | null;
}

export function statsSummary(tasks: Task[], now: number, staleDays = STALE_DAYS_DEFAULT): StatsSummary {
  const lv = live(tasks);
  const weeks = weeklyActivity(tasks, now, 2);
  return {
    openN: lv.filter(t => t.status !== 'done').length,
    closedWeek: weeks[1].closed,
    closedPrevWeek: weeks[0].closed,
    createdWeek: weeks[1].created,
    staleN: lv.filter(t => isStale(t, now, staleDays)).length,
    streak: completionStreak(tasks, now),
    medianClose: medianDaysToClose(tasks),
  };
}
