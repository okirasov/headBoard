import { DAY_MS, STALE_DAYS_DEFAULT, type Lang, type Priority, type Task } from './model';
import { dict } from './i18n';
import { startOfDay, fmtDate } from './dates';

/** Design-token names for the priority bar / dot. */
export const PRIORITY_BAR_TOKEN: Record<Priority, 'hi' | 'med' | 'lineStrong'> = { 0: 'hi', 1: 'med', 2: 'lineStrong' };

export function idleDays(t: Task, now: number): number {
  return Math.max(0, Math.floor((now - t.touched) / DAY_MS));
}

export function isSnoozed(t: Task, now: number): boolean {
  return !!t.snoozedUntil && t.snoozedUntil > now;
}

export function isStale(t: Task, now: number, staleDays = STALE_DAYS_DEFAULT): boolean {
  return t.status !== 'done' && t.status !== 'archived' && idleDays(t, now) >= staleDays && !isSnoozed(t, now);
}

/** Days from today to the due date (negative = overdue), or null when no due date. */
export function dueDiff(t: Task, now: number): number | null {
  return t.due == null ? null : Math.round((startOfDay(t.due) - startOfDay(now)) / DAY_MS);
}

export function dueLabel(t: Task, lang: Lang, now: number): string | null {
  const T = dict(lang);
  const df = dueDiff(t, now);
  if (df === null) return null;
  if (df < 0) return T.overdue;
  if (df === 0) return T.today;
  if (df === 1) return T.tomorrow;
  const dt = new Date(t.due as number);
  if (df < 7) return T.DOWS[dt.getDay()] + ' ' + dt.getDate();
  return fmtDate(t.due as number, lang);
}

/** Token for the due label colour. */
export function dueTone(t: Task, now: number): 'hi' | 'acc' | 'mut2' {
  const df = dueDiff(t, now);
  return df !== null && df < 0 ? 'hi' : df === 0 ? 'acc' : 'mut2';
}

export function live(tasks: Task[]): Task[] {
  return tasks.filter(t => t.status !== 'archived');
}

/** Archived tasks, most recently archived first (falls back to `touched`). */
export function archived(tasks: Task[]): Task[] {
  return tasks.filter(t => t.status === 'archived').sort((a, b) => (b.archivedAt ?? b.touched) - (a.archivedAt ?? a.touched));
}

/** Stale first (oldest idle first), then priority, then idle desc. */
export function sortAutoBump(tasks: Task[], now: number, staleDays = STALE_DAYS_DEFAULT): Task[] {
  return [...tasks].sort((a, b) => {
    const sa = isStale(a, now, staleDays) ? 1 : 0, sb = isStale(b, now, staleDays) ? 1 : 0;
    const ia = idleDays(a, now), ib = idleDays(b, now);
    return (sb - sa) || (sa ? ib - ia : 0) || (a.pr - b.pr) || (ib - ia);
  });
}

export function sortByPriority(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => a.pr - b.pr);
}

/** Newest completed first, max `limit`. */
export function sortDone(tasks: Task[], limit = 8): Task[] {
  return [...tasks].sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0)).slice(0, limit);
}

export function matchesFilter(t: Task, q: string, fPr: Priority | null, fProj: string | null): boolean {
  const query = q.trim().toLowerCase();
  return (!query || (t.title + ' ' + t.tags.join(' ')).toLowerCase().includes(query))
    && (fPr === null || t.pr === fPr)
    && (!fProj || t.proj === fProj);
}
