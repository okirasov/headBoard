import type { Priority, Project, Status, Task } from './model';

export type MatchField = 'title' | 'tags' | 'note' | 'comment' | 'project';

export interface SearchHit {
  task: Task;
  /** Fields where every query word matched at least once (ordered by weight). */
  fields: MatchField[];
  /** Relevance: title hits weigh most, then tags, project, note, comments. */
  score: number;
  /** Short excerpt from the best non-title field with the first match, for the result row. */
  snippet: { field: MatchField; text: string } | null;
}

export interface SearchOptions {
  statuses?: Status[];
  priority?: Priority | null;
  proj?: string | null;
  limit?: number;
}

const WEIGHT: Record<MatchField, number> = { title: 10, tags: 6, project: 4, note: 3, comment: 2 };

export function tokenize(q: string): string[] {
  return q.toLowerCase().split(/[\s,;]+/).map(w => w.replace(/^#/, '')).filter(w => w.length > 0);
}

function hasAll(text: string, words: string[]): boolean {
  const t = text.toLowerCase();
  return words.every(w => t.includes(w));
}

/** Cut a window around the first matching word, with ellipses. */
export function excerpt(text: string, words: string[], radius = 48): string {
  const t = text.toLowerCase();
  const idx = Math.min(...words.map(w => { const i = t.indexOf(w); return i < 0 ? Infinity : i; }));
  const start = Number.isFinite(idx) ? Math.max(0, idx - radius) : 0;
  const end = Math.min(text.length, (Number.isFinite(idx) ? idx : 0) + radius * 2);
  return (start > 0 ? '…' : '') + text.slice(start, end).trim() + (end < text.length ? '…' : '');
}

/** Split `text` into plain/marked runs for highlighting query words (case-insensitive). */
export function highlight(text: string, words: string[]): Array<{ text: string; hit: boolean }> {
  if (!words.length || !text) return [{ text, hit: false }];
  const re = new RegExp('(' + words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'gi');
  const out: Array<{ text: string; hit: boolean }> = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    const i = m.index ?? 0;
    if (i > last) out.push({ text: text.slice(last, i), hit: false });
    out.push({ text: m[0], hit: true });
    last = i + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), hit: false });
  return out;
}

/**
 * Full-text search over title, tags, project name, note and comments. All query words must appear,
 * each word may match in a different field. Results are sorted by relevance, then by `touched`.
 */
export function searchTasks(tasks: Task[], projects: Project[], query: string, opts: SearchOptions = {}): SearchHit[] {
  const words = tokenize(query);
  if (!words.length) return [];
  const pname = new Map(projects.map(p => [p.id, p.name]));
  const hits: SearchHit[] = [];
  for (const t of tasks) {
    if (opts.statuses?.length && !opts.statuses.includes(t.status)) continue;
    if (opts.priority !== null && opts.priority !== undefined && t.pr !== opts.priority) continue;
    if (opts.proj && t.proj !== opts.proj) continue;
    const fieldsText: Array<[MatchField, string]> = [
      ['title', t.title], ['tags', t.tags.join(' ')], ['project', t.proj ? pname.get(t.proj) ?? '' : ''], ['note', t.note],
      ['comment', t.comments.map(c => c.text).join(' \n ')],
    ];
    const all = fieldsText.map(f => f[1]).join(' \n ');
    if (!hasAll(all, words)) continue;
    const fields = fieldsText.filter(([, text]) => words.some(w => text.toLowerCase().includes(w))).map(([f]) => f);
    const score = fields.reduce((s, f) => s + WEIGHT[f] * words.filter(w => fieldsText.find(x => x[0] === f)![1].toLowerCase().includes(w)).length, 0);
    const snippetField = (['note', 'comment', 'tags'] as MatchField[]).find(f => fields.includes(f)) ?? null;
    let snippet: SearchHit['snippet'] = null;
    if (snippetField) {
      const src = snippetField === 'comment'
        ? (t.comments.find(c => words.some(w => c.text.toLowerCase().includes(w)))?.text ?? '')
        : snippetField === 'tags' ? t.tags.map(x => '#' + x).join(' ') : t.note;
      snippet = { field: snippetField, text: excerpt(src, words) };
    }
    hits.push({ task: t, fields, score, snippet });
  }
  hits.sort((a, b) => b.score - a.score || b.task.touched - a.task.touched);
  return opts.limit ? hits.slice(0, opts.limit) : hits;
}
