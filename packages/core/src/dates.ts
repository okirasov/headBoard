import { DAY_MS, type Lang } from './model';
import { dict } from './i18n';

export function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function addDays(ts: number, n: number): number {
  const d = new Date(ts);
  d.setDate(d.getDate() + n);
  return d.getTime();
}

export function addMonths(ts: number, n: number): number {
  const d = new Date(ts);
  d.setMonth(d.getMonth() + n);
  return d.getTime();
}

/** "Sep 8" (en) or "8 сен" (ru). */
export function fmtDate(ts: number, lang: Lang): string {
  const T = dict(lang);
  const dt = new Date(ts);
  return lang === 'ru' ? dt.getDate() + ' ' + T.MON[dt.getMonth()] : T.MON[dt.getMonth()] + ' ' + dt.getDate();
}

/** "Monday, Sep 8" */
export function todayLabel(now: number, lang: Lang): string {
  const T = dict(lang);
  return T.DOW[new Date(now).getDay()] + ', ' + fmtDate(now, lang);
}

/** "September 2026" for month offset from now */
export function monthLabel(now: number, offset: number, lang: Lang): string {
  const T = dict(lang);
  const n = new Date(now);
  const m = new Date(n.getFullYear(), n.getMonth() + offset, 1);
  return T.MONF[m.getMonth()] + ' ' + m.getFullYear();
}

/** "08:00" in the local zone. */
export function fmtTime(ts: number): string {
  const d = new Date(ts);
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

/** Digest freshness: "08:00" if today, otherwise "Sep 8, 08:00" / "8 сен, 08:00". */
export function fmtDateTimeShort(ts: number, lang: Lang, now: number): string {
  return startOfDay(ts) === startOfDay(now) ? fmtTime(ts) : fmtDate(ts, lang) + ', ' + fmtTime(ts);
}

export function daysBetween(a: number, b: number): number {
  return Math.round((startOfDay(b) - startOfDay(a)) / DAY_MS);
}

/** Comment time: "just now" (<90s), "today", or a date. */
export function commentTime(at: number, lang: Lang, now: number): string {
  const T = dict(lang);
  if (now - at < 9e4) return T.justNow;
  if (startOfDay(at) === startOfDay(now)) return T.today;
  return fmtDate(at, lang);
}

export function sizeHuman(bytes: number): string {
  return bytes > 9e5 ? (bytes / 1e6).toFixed(1) + ' MB' : Math.max(1, Math.round(bytes / 1000)) + ' KB';
}
