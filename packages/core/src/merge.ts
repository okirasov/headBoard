import type { Comment, FileRef, HistoryEntry, Task } from './model';
import { HISTORY_CAP } from './history';

/**
 * Three-way merge of one task: `base` is the last version this device synced, `local` is what the
 * device has now, `server` is what the API has now. A field changed on one side only takes that side;
 * a field changed on both sides goes to the side that was touched more recently. Collections
 * (comments, files, history) merge by id, so an addition on one device and a deletion on another
 * both survive. Without a base (first sync of that task on this device) the more recently touched
 * version wins as a whole.
 */
export function mergeTask(base: Task | null, local: Task, server: Task): Task {
  if (!base) return server.touched >= local.touched ? server : local;
  const serverNewer = server.touched >= local.touched;
  const pick = <K extends keyof Task>(k: K): Task[K] => {
    const l = JSON.stringify(local[k]);
    const s = JSON.stringify(server[k]);
    const b = JSON.stringify(base[k]);
    if (l === s) return local[k];
    if (l === b) return server[k];
    if (s === b) return local[k];
    return serverNewer ? server[k] : local[k];
  };
  return {
    ...local,
    id: local.id,
    title: pick('title'),
    proj: pick('proj'),
    pr: pick('pr'),
    status: pick('status'),
    touched: Math.max(local.touched, server.touched),
    created: Math.min(local.created, server.created),
    due: pick('due'),
    snoozedUntil: pick('snoozedUntil'),
    recur: pick('recur'),
    tags: pick('tags'),
    note: pick('note'),
    chat: pick('chat'),
    doneAt: pick('doneAt'),
    archivedAt: pick('archivedAt'),
    remindDays: pick('remindDays'),
    seriesId: pick('seriesId'),
    comments: mergeById(base.comments, local.comments, server.comments, c => c.id).sort((a, b) => a.at - b.at),
    files: mergeById(base.files, local.files, server.files, f => f.id),
    history: capHistory(mergeById(base.history ?? [], local.history ?? [], server.history ?? [], h => h.id).sort((a, b) => a.at - b.at)),
  };
}

/** Union of both sides, minus items that were in the base and removed on either side; edits favour the local copy. */
export function mergeById<T>(base: T[], local: T[], server: T[], id: (x: T) => string): T[] {
  const baseIds = new Set(base.map(id));
  const localIds = new Set(local.map(id));
  const serverIds = new Set(server.map(id));
  const out: T[] = [];
  const seen = new Set<string>();
  for (const x of [...local, ...server]) {
    const k = id(x);
    if (seen.has(k)) continue;
    seen.add(k);
    const removedElsewhere = baseIds.has(k) && (!localIds.has(k) || !serverIds.has(k));
    if (removedElsewhere) continue;
    out.push(x);
  }
  return out;
}

const SCALARS = ['title', 'proj', 'pr', 'status', 'touched', 'created', 'due', 'snoozedUntil', 'recur', 'tags', 'note', 'chat', 'doneAt', 'archivedAt', 'remindDays', 'seriesId'] as const;

/**
 * What to send for a task that changed since `base`: only the fields that differ (so a device that
 * edited the note never overwrites a date changed elsewhere), comments that were added or edited
 * (the server upserts by id), ids of comments removed here (deleted via their own endpoint), and the
 * files / history lists when they changed.
 */
export function taskDelta(base: Task, next: Task): { patch: Partial<Task>; removedComments: string[] } {
  const patch: Partial<Task> = {};
  for (const k of SCALARS) if (JSON.stringify(base[k]) !== JSON.stringify(next[k])) (patch as Record<string, unknown>)[k] = next[k];
  const baseC = new Map(base.comments.map(c => [c.id, c]));
  const upserts = next.comments.filter(c => { const b = baseC.get(c.id); return !b || b.text !== c.text || b.at !== c.at; });
  if (upserts.length) patch.comments = upserts;
  const nextIds = new Set(next.comments.map(c => c.id));
  const removedComments = base.comments.filter(c => !nextIds.has(c.id)).map(c => c.id);
  if (JSON.stringify(base.files) !== JSON.stringify(next.files)) patch.files = next.files;
  if (JSON.stringify(base.history ?? []) !== JSON.stringify(next.history ?? [])) patch.history = next.history;
  return { patch, removedComments };
}

function capHistory(h: HistoryEntry[]): HistoryEntry[] {
  return h.length > HISTORY_CAP ? h.slice(h.length - HISTORY_CAP) : h;
}

export type { Comment, FileRef };
