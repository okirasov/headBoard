import type { Lang, Task } from './model';
import { addDays, addMonths, startOfDay } from './dates';
import { dict } from './i18n';

export interface MonthDay {
  ts: number;
  n: number;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isFuture: boolean;
  count: number;
  heavy: boolean;
}
export interface Week<D> { key: string; days: D[] }

function gridStart(year: number, month: number): Date {
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(1 - ((first.getDay() + 6) % 7)); // Monday-first
  return start;
}

/** 6×7 grid of the current month with per-day open-task counts. */
export function buildMonthGrid(tasks: Task[], opts: { now: number; selected: number | null }): Week<MonthDay>[] {
  const today = startOfDay(opts.now);
  const n = new Date(today);
  const start = gridStart(n.getFullYear(), n.getMonth());
  const open = tasks.filter(t => t.due !== null && t.status !== 'done' && t.status !== 'archived');
  const weeks: Week<MonthDay>[] = [];
  for (let w = 0; w < 6; w++) {
    const days: MonthDay[] = [];
    for (let i = 0; i < 7; i++) {
      const dt = new Date(start);
      dt.setDate(start.getDate() + w * 7 + i);
      const ts = dt.getTime();
      const count = open.filter(t => startOfDay(t.due as number) === ts).length;
      days.push({
        ts, n: dt.getDate(), inMonth: dt.getMonth() === n.getMonth(), isToday: ts === today,
        isSelected: opts.selected === ts, isFuture: ts > today, count, heavy: count >= 3,
      });
    }
    weeks.push({ key: 'w' + w, days });
  }
  return weeks;
}

export interface SnoozeDay { ts: number; n: number; inMonth: boolean; isToday: boolean; disabled: boolean }

/** 6×7 grid for month `now + monthOffset`; days up to and including today are disabled. */
export function buildSnoozeGrid(opts: { now: number; monthOffset: number }): Week<SnoozeDay>[] {
  const today = startOfDay(opts.now);
  const t = new Date(today);
  const m0 = new Date(t.getFullYear(), t.getMonth() + opts.monthOffset, 1);
  const start = gridStart(m0.getFullYear(), m0.getMonth());
  const weeks: Week<SnoozeDay>[] = [];
  for (let w = 0; w < 6; w++) {
    const days: SnoozeDay[] = [];
    for (let i = 0; i < 7; i++) {
      const dt = new Date(start);
      dt.setDate(start.getDate() + w * 7 + i);
      const ts = dt.getTime();
      days.push({ ts, n: dt.getDate(), inMonth: dt.getMonth() === m0.getMonth(), isToday: ts === today, disabled: ts <= today });
    }
    weeks.push({ key: 'zw' + w, days });
  }
  return weeks;
}

export type SnoozePresetKey = 'tomorrow' | 'd3' | 'week' | 'month';
export interface SnoozePreset { key: SnoozePresetKey; ts: number }

export function snoozePresets(now: number): SnoozePreset[] {
  const today = startOfDay(now);
  return [
    { key: 'tomorrow', ts: addDays(today, 1) },
    { key: 'd3', ts: addDays(today, 3) },
    { key: 'week', ts: addDays(today, 7) },
    { key: 'month', ts: addMonths(today, 1) },
  ];
}

export function snoozePresetLabel(key: SnoozePresetKey, lang: Lang): string {
  const T = dict(lang);
  return { tomorrow: T.zTomorrow, d3: T.z3d, week: T.zWeek, month: T.zMonth }[key];
}

export function weekdayLabels(lang: Lang): string[] {
  const T = dict(lang);
  return [T.dw1, T.dw2, T.dw3, T.dw4, T.dw5, T.dw6, T.dw7];
}
