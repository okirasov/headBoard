export type Priority = 0 | 1 | 2; // 0 High, 1 Medium, 2 Low
export type Status = 'inbox' | 'focus' | 'waiting' | 'done' | 'archived';
export type ColumnKey = Exclude<Status, 'archived'>;
export type Lang = 'en' | 'ru';
export type Theme = 'light' | 'dark';
export type View = 'board' | 'review' | 'digest' | 'calendar' | 'archive' | 'projects' | 'stats' | 'search' | 'due' | 'recurring' | 'tags' | 'templates' | 'history';
export type Provider = 'Google' | 'Apple';
export type Recur = 'daily' | 'weekly' | 'monthly' | null;

export interface FileRef {
  id: string;
  name: string;
  kind: 'img' | 'file';
  size?: number;
  /** data URL for locally read images */
  src?: string;
}

export interface Comment {
  id: string;
  text: string;
  at: number;
}

export type HistoryKind =
  | 'created' | 'status' | 'done' | 'reopened' | 'archived' | 'restored'
  | 'priority' | 'due' | 'title' | 'note' | 'project' | 'tags' | 'recur' | 'remind'
  | 'snoozed' | 'unsnoozed' | 'bumped' | 'comment' | 'comment_edited' | 'comment_removed' | 'file' | 'file_removed' | 'chat';

/** One change on a task. `from`/`to` are strings (ids, epoch ms, labels) so the log survives renames. */
export interface HistoryEntry {
  id: string;
  at: number;
  kind: HistoryKind;
  from?: string | null;
  to?: string | null;
  /** Who made the change when it was not the user in a client. */
  source?: 'calendar' | 'template' | 'recur' | 'capture' | 'sync' | 'api';
}

export interface Task {
  id: string;
  title: string;
  proj: string | null;
  pr: Priority;
  status: Status;
  touched: number;
  created: number;
  due: number | null;
  snoozedUntil: number;
  recur: Recur;
  tags: string[];
  note: string;
  chat: string | null;
  files: FileRef[];
  comments: Comment[];
  doneAt: number | null;
  /** When the task was archived; null while live. */
  archivedAt: number | null;
  /** Due reminder: 0 = push on the due day, 1 = the day before, null = none. */
  remindDays: 0 | 1 | null;
  /** Change log, oldest first, capped (see history.ts). */
  history: HistoryEntry[];
  /** Recurring series this instance belongs to (id of the first instance); null for one-off tasks. */
  seriesId: string | null;
}

export interface Project {
  id: string;
  name: string;
  /** CSS colour; user data, not a design token */
  color: string;
}

export interface User {
  name: string;
  email: string;
  provider: Provider;
  initials: string;
}

/** A saved task blueprint; `{placeholders}` in title/note are asked for on use. */
export interface Template {
  id: string;
  name: string;
  title: string;
  proj: string | null;
  pr: Priority;
  tags: string[];
  note: string;
  /** Due date relative to the day of use, in days; null = no due date. */
  dueInDays: number | null;
  remindDays: 0 | 1 | null;
  usedCount: number;
}

export interface CaptureItem {
  title: string;
  pr: Priority;
  tags: string[];
  proj: string | null;
}

export const DAY_MS = 864e5;
export const STALE_DAYS_DEFAULT = 7;
/** Choices offered in settings for the forgotten-task threshold. */
export const STALE_DAYS_OPTIONS = [3, 5, 7, 14] as const;
export const COLUMN_KEYS: ColumnKey[] = ['inbox', 'focus', 'waiting', 'done'];

export function clampPriority(n: number): Priority {
  return Math.min(2, Math.max(0, n | 0)) as Priority;
}

export function newTask(partial: Partial<Task> & { title: string }, now: number): Task {
  return {
    id: partial.id ?? 'n' + now + Math.random().toString(36).slice(2, 6),
    title: partial.title,
    proj: partial.proj ?? null,
    pr: partial.pr ?? 1,
    status: partial.status ?? 'inbox',
    touched: partial.touched ?? now,
    created: partial.created ?? now,
    due: partial.due ?? null,
    snoozedUntil: partial.snoozedUntil ?? 0,
    recur: partial.recur ?? null,
    tags: partial.tags ?? [],
    note: partial.note ?? '',
    chat: partial.chat ?? null,
    files: partial.files ?? [],
    comments: partial.comments ?? [],
    doneAt: partial.doneAt ?? null,
    archivedAt: partial.archivedAt ?? null,
    remindDays: partial.remindDays ?? null,
    history: partial.history ?? [{ id: 'h' + now.toString(36) + Math.random().toString(36).slice(2, 5), at: partial.created ?? now, kind: 'created' }],
    seriesId: partial.seriesId ?? null,
  };
}
