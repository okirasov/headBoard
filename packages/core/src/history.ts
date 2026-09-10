import type { HistoryEntry, HistoryKind, Lang, Project, Task } from './model';
import { fmtDate, fmtTime, startOfDay } from './dates';
import { dict, priorityLabel, recurLabel, statusLabel } from './i18n';

/** Entries kept per task; older ones drop off the front. */
export const HISTORY_CAP = 200;

export function historyId(at: number): string {
  return 'h' + at.toString(36) + Math.random().toString(36).slice(2, 5);
}

function entry(kind: HistoryKind, at: number, extra: Partial<HistoryEntry> = {}): HistoryEntry {
  return { id: historyId(at), at, kind, ...extra };
}

const str = (v: number | string | null | undefined) => (v === null || v === undefined ? null : String(v));

/** Field-by-field difference between two versions of a task, as history entries. */
export function diffTask(prev: Task, next: Task, at: number, source?: HistoryEntry['source']): HistoryEntry[] {
  const out: HistoryEntry[] = [];
  const s: Partial<HistoryEntry> = source ? { source } : {};
  if (prev.status !== next.status) {
    const kind: HistoryKind =
      next.status === 'done' ? 'done'
      : next.status === 'archived' ? 'archived'
      : prev.status === 'archived' ? 'restored'
      : prev.status === 'done' ? 'reopened'
      : 'status';
    out.push(entry(kind, at, { from: prev.status, to: next.status, ...s }));
  }
  if (prev.pr !== next.pr) out.push(entry('priority', at, { from: str(prev.pr), to: str(next.pr), ...s }));
  if (prev.due !== next.due) out.push(entry('due', at, { from: str(prev.due), to: str(next.due), ...s }));
  if (prev.title !== next.title) out.push(entry('title', at, { from: prev.title, to: next.title, ...s }));
  if (prev.note !== next.note) out.push(entry('note', at, { ...s }));
  if (prev.proj !== next.proj) out.push(entry('project', at, { from: prev.proj, to: next.proj, ...s }));
  if (prev.tags.join(' ') !== next.tags.join(' ')) out.push(entry('tags', at, { from: prev.tags.join(' '), to: next.tags.join(' '), ...s }));
  if (prev.recur !== next.recur) out.push(entry('recur', at, { from: prev.recur, to: next.recur, ...s }));
  if (prev.remindDays !== next.remindDays) out.push(entry('remind', at, { from: str(prev.remindDays), to: str(next.remindDays), ...s }));
  if ((prev.snoozedUntil || 0) !== (next.snoozedUntil || 0)) {
    out.push(entry(next.snoozedUntil ? 'snoozed' : 'unsnoozed', at, { to: next.snoozedUntil ? String(next.snoozedUntil) : null, ...s }));
  }
  if (prev.comments.length < next.comments.length) out.push(entry('comment', at, { to: next.comments[next.comments.length - 1]?.text ?? '', ...s }));
  if (prev.comments.length > next.comments.length) out.push(entry('comment_removed', at, { ...s }));
  if (next.files.some(f => !prev.files.some(p => p.id === f.id))) {
    out.push(entry('file', at, { to: next.files.filter(f => !prev.files.some(p => p.id === f.id)).map(f => f.name).join(', '), ...s }));
  }
  if (prev.files.some(f => !next.files.some(n => n.id === f.id))) {
    out.push(entry('file_removed', at, { from: prev.files.filter(f => !next.files.some(n => n.id === f.id)).map(f => f.name).join(', '), ...s }));
  }
  if (out.length === 0 && next.touched > prev.touched) out.push(entry('bumped', at, { ...s }));
  return out;
}

/** `next` with the diff against `prev` appended to its history (oldest first, capped). */
export function withHistory(prev: Task, next: Task, at: number, source?: HistoryEntry['source']): Task {
  const added = diffTask(prev, next, at, source);
  if (!added.length) return next;
  const history = [...(next.history ?? []), ...added];
  return { ...next, history: history.length > HISTORY_CAP ? history.slice(history.length - HISTORY_CAP) : history };
}

export function createdEntry(at: number, source?: HistoryEntry['source']): HistoryEntry {
  return entry('created', at, source ? { source } : {});
}

/** Entries newest first, grouped by local day (groups newest first too). */
export function historyByDay(history: HistoryEntry[]): Array<{ day: number; entries: HistoryEntry[] }> {
  const sorted = [...history].sort((a, b) => b.at - a.at);
  const groups: Array<{ day: number; entries: HistoryEntry[] }> = [];
  for (const e of sorted) {
    const day = startOfDay(e.at);
    const g = groups[groups.length - 1];
    if (g && g.day === day) g.entries.push(e);
    else groups.push({ day, entries: [e] });
  }
  return groups;
}

/** Human-readable label + detail for an entry. `projects` resolves project ids to names. */
export function historyText(e: HistoryEntry, lang: Lang, projects: Project[] = []): { label: string; detail: string } {
  const T = dict(lang);
  const ru = lang === 'ru';
  const pname = (id: string | null | undefined) => (id ? projects.find(p => p.id === id)?.name ?? id : T.noProject);
  const date = (v: string | null | undefined) => (v ? fmtDate(Number(v), lang) : '—');
  const arrow = (a: string, b: string) => `${a} → ${b}`;
  const remind = (v: string | null | undefined) => (v === null || v === undefined ? T.remindNone : v === '0' ? T.remindDay : T.remindDayBefore);
  const tags = (v: string | null | undefined) => (v ? v.split(' ').map(x => '#' + x).join(' ') : '—');
  switch (e.kind) {
    case 'created': {
      const by = e.source === 'template' ? T.hSrcTemplate : e.source === 'calendar' ? T.hSrcCalendar : e.source === 'recur' ? T.hSrcRecur : e.source === 'capture' ? T.hSrcCapture : '';
      return { label: T.hCreated, detail: by };
    }
    case 'done': return { label: T.hDone, detail: e.source === 'calendar' ? T.hSrcCalendar : '' };
    case 'reopened': return { label: T.hReopened, detail: statusLabel(e.to ?? '', lang) };
    case 'archived': return { label: T.hArchived, detail: '' };
    case 'restored': return { label: T.hRestored, detail: statusLabel(e.to ?? '', lang) };
    case 'status': return { label: T.status, detail: arrow(statusLabel(e.from ?? '', lang), statusLabel(e.to ?? '', lang)) };
    case 'priority': return { label: T.priority, detail: arrow(priorityLabel(Number(e.from) as 0 | 1 | 2, lang), priorityLabel(Number(e.to) as 0 | 1 | 2, lang)) };
    case 'due': return { label: T.due, detail: arrow(date(e.from), date(e.to)) + (e.source === 'calendar' ? ` · ${T.hSrcCalendar}` : '') };
    case 'title': return { label: T.hTitle, detail: arrow(e.from ?? '', e.to ?? '') };
    case 'note': return { label: T.hNote, detail: T.hEdited };
    case 'project': return { label: T.hProject, detail: arrow(pname(e.from), pname(e.to)) };
    case 'tags': return { label: T.hTags, detail: arrow(tags(e.from), tags(e.to)) };
    case 'recur': return { label: T.repeats, detail: arrow(recurLabel(e.from ?? null, lang), recurLabel(e.to ?? null, lang)) };
    case 'remind': return { label: T.remindLbl, detail: arrow(remind(e.from), remind(e.to)) };
    case 'snoozed': return { label: T.snoozeLbl, detail: T.zUntil + date(e.to) };
    case 'unsnoozed': return { label: T.snoozeLbl, detail: T.hCleared };
    case 'bumped': return { label: T.bump, detail: T.hBumped };
    case 'comment': return { label: T.comments, detail: e.to ?? '' };
    case 'comment_removed': return { label: T.comments, detail: T.hCommentRemoved };
    case 'file': return { label: T.attachments, detail: e.to ?? '' };
    case 'file_removed': return { label: T.attachments, detail: T.hRemoved + (e.from ?? '') };
    default: return { label: ru ? e.kind : e.kind, detail: '' };
  }
}

export function historyTime(e: HistoryEntry): string {
  return fmtTime(e.at);
}
