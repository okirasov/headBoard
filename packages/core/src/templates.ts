import { type Priority, type Task, type Template, newTask } from './model';
import { addDays, startOfDay } from './dates';
import { normalizeTags } from './tags';

export function newTemplate(partial: Partial<Template> & { name: string }, now = Date.now()): Template {
  return {
    id: partial.id ?? 't' + now + Math.random().toString(36).slice(2, 6),
    name: partial.name.trim().slice(0, 60),
    title: (partial.title ?? partial.name).trim().slice(0, 90),
    proj: partial.proj ?? null,
    pr: partial.pr ?? 1,
    tags: normalizeTags(partial.tags ?? []),
    note: partial.note ?? '',
    dueInDays: partial.dueInDays ?? null,
    remindDays: partial.remindDays ?? null,
    usedCount: partial.usedCount ?? 0,
  };
}

/** Placeholder names in `{braces}` used by the title and note, in order of first appearance. */
export function templatePlaceholders(t: Pick<Template, 'title' | 'note'>): string[] {
  const out: string[] = [];
  for (const m of (t.title + ' ' + t.note).matchAll(/\{([^{}]{1,40})\}/g)) { const k = m[1].trim(); if (k && !out.includes(k)) out.push(k); }
  return out;
}

export function fillPlaceholders(text: string, values: Record<string, string>): string {
  return text.replace(/\{([^{}]{1,40})\}/g, (m, k: string) => { const v = values[k.trim()]; return v && v.trim() ? v.trim() : m; });
}

/** Build a fresh task from a template; the due date is `dueInDays` from today at noon (DST-safe). */
export function applyTemplate(t: Template, values: Record<string, string>, now: number): Task {
  const due = t.dueInDays === null ? null : addDays(startOfDay(now), t.dueInDays) + 12 * 3600_000;
  return newTask({
    title: fillPlaceholders(t.title, values).slice(0, 90), proj: t.proj, pr: t.pr as Priority, tags: t.tags,
    note: fillPlaceholders(t.note, values), due, remindDays: due === null ? null : t.remindDays, created: now, touched: now,
  }, now);
}

/** Capture the fields of an existing task as a template. */
export function templateFromTask(task: Task, name?: string): Template {
  return newTemplate({ name: name ?? task.title, title: task.title, proj: task.proj, pr: task.pr, tags: task.tags, note: task.note, dueInDays: null, remindDays: task.remindDays });
}
