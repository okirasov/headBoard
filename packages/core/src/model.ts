export type Priority = 0 | 1 | 2; // 0 High, 1 Medium, 2 Low
export type Status = 'inbox' | 'focus' | 'waiting' | 'done' | 'archived';
export type ColumnKey = Exclude<Status, 'archived'>;
export type Lang = 'en' | 'ru';
export type Theme = 'light' | 'dark';
export type View = 'board' | 'review' | 'digest' | 'calendar' | 'archive' | 'projects';
export type Provider = 'Google' | 'Apple';

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
  recur: 'weekly' | null;
  tags: string[];
  note: string;
  chat: string | null;
  files: FileRef[];
  comments: Comment[];
  doneAt: number | null;
  /** When the task was archived; null while live. */
  archivedAt: number | null;
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

export interface CaptureItem {
  title: string;
  pr: Priority;
  tags: string[];
  proj: string | null;
}

export const DAY_MS = 864e5;
export const STALE_DAYS_DEFAULT = 7;
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
  };
}
