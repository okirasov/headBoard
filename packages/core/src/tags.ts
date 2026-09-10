import type { Task } from './model';

/** Canonical tag form: lowercase, no leading '#', inner whitespace → '-', only letters/digits/_/-, ≤ 30 chars. */
export function normalizeTag(raw: string): string {
  return raw.trim().replace(/^#+/, '').toLowerCase().replace(/\s+/g, '-').replace(/[^\p{L}\p{N}_-]/gu, '').replace(/-{2,}/g, '-').replace(/^-|-$/g, '').slice(0, 30);
}

/** Normalize a list, dropping empties and duplicates, keeping first-seen order. */
export function normalizeTags(raw: string[]): string[] {
  const out: string[] = [];
  for (const r of raw) { const t = normalizeTag(r); if (t && !out.includes(t)) out.push(t); }
  return out;
}

export interface TagStat { tag: string; open: number; done: number; archived: number; total: number; lastUsed: number }

/** Usage per tag across all tasks, most used (open first) on top. */
export function tagStats(tasks: Task[]): TagStat[] {
  const m = new Map<string, TagStat>();
  for (const t of tasks) {
    for (const tag of t.tags) {
      const s = m.get(tag) ?? { tag, open: 0, done: 0, archived: 0, total: 0, lastUsed: 0 };
      if (t.status === 'archived') s.archived++; else if (t.status === 'done') s.done++; else s.open++;
      s.total++;
      s.lastUsed = Math.max(s.lastUsed, t.touched);
      m.set(tag, s);
    }
  }
  return [...m.values()].sort((a, b) => b.open - a.open || b.total - a.total || a.tag.localeCompare(b.tag));
}

/** Tags that no open task uses any more. */
export function unusedTags(stats: TagStat[]): TagStat[] {
  return stats.filter(s => s.open === 0);
}

/** Rename (or merge into an existing tag). Returns only the tasks that changed. */
export function renameTag(tasks: Task[], from: string, to: string): Task[] {
  const target = normalizeTag(to);
  if (!target || target === from) return [];
  return tasks.filter(t => t.tags.includes(from)).map(t => ({ ...t, tags: normalizeTags(t.tags.map(x => (x === from ? target : x))) }));
}

/** Remove a tag everywhere. Returns only the tasks that changed. */
export function removeTag(tasks: Task[], tag: string): Task[] {
  return tasks.filter(t => t.tags.includes(tag)).map(t => ({ ...t, tags: t.tags.filter(x => x !== tag) }));
}

/** Autocomplete: known tags starting with (then containing) the prefix, excluding the given ones. */
export function suggestTags(tasks: Task[], prefix: string, exclude: string[] = [], limit = 6): string[] {
  const p = normalizeTag(prefix);
  const all = tagStats(tasks).map(s => s.tag).filter(t => !exclude.includes(t));
  if (!p) return all.slice(0, limit);
  return [...all.filter(t => t.startsWith(p)), ...all.filter(t => !t.startsWith(p) && t.includes(p))].slice(0, limit);
}
