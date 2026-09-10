import { type Project, type Task, type Template, newTask } from './model';
import { newTemplate } from './templates';
import { mergeTask } from './merge';

/** Portable snapshot of a user's data (attachments are referenced by name only; file bytes stay on the server). */
export interface Backup {
  app: 'headboard';
  version: 1;
  exportedAt: number;
  tasks: Task[];
  projects: Project[];
  templates: Template[];
}

export function exportBackup(state: { tasks: Task[]; projects: Project[]; templates: Template[] }, now: number): Backup {
  return { app: 'headboard', version: 1, exportedAt: now, tasks: state.tasks, projects: state.projects, templates: state.templates };
}

export function backupFilename(now: number): string {
  const d = new Date(now);
  const p = (n: number) => String(n).padStart(2, '0');
  return `headboard-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.json`;
}

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const str = (x: unknown): x is string => typeof x === 'string';

/** Parse and normalise a backup file; null when it is not a Headboard export. Missing fields get defaults via newTask/newTemplate. */
export function parseBackup(json: string, now: number): Backup | null {
  let raw: unknown;
  try { raw = JSON.parse(json); } catch { return null; }
  if (!isObj(raw) || raw.app !== 'headboard' || !Array.isArray(raw.tasks)) return null;
  const tasks: Task[] = [];
  for (const t of raw.tasks) {
    if (!isObj(t) || !str(t.id) || !str(t.title)) continue;
    tasks.push(newTask({ ...(t as Partial<Task>), title: t.title }, now));
  }
  const projects: Project[] = Array.isArray(raw.projects)
    ? (raw.projects as unknown[]).filter((p): p is Project => isObj(p) && str(p.id) && str(p.name)).map(p => ({ id: p.id, name: p.name, color: str(p.color) ? p.color : 'var(--acc)' }))
    : [];
  const templates: Template[] = Array.isArray(raw.templates)
    ? (raw.templates as unknown[]).filter((t): t is Template => isObj(t) && str(t.id) && str(t.name)).map(t => newTemplate({ ...t }))
    : [];
  return { app: 'headboard', version: 1, exportedAt: typeof raw.exportedAt === 'number' ? raw.exportedAt : now, tasks, projects, templates };
}

export interface ImportResult { tasks: Task[]; projects: Project[]; templates: Template[]; added: number; updated: number }

/**
 * Merge a backup into current data by id: unknown items are added, known tasks take the more recently
 * touched version (mergeTask without a base), known projects and templates keep the current copy.
 * Tasks whose project is unknown after the merge are detached rather than dropped.
 */
export function mergeBackup(current: { tasks: Task[]; projects: Project[]; templates: Template[] }, b: Backup): ImportResult {
  const projects = [...current.projects];
  for (const p of b.projects) if (!projects.some(x => x.id === p.id)) projects.push(p);
  const templates = [...current.templates];
  for (const t of b.templates) if (!templates.some(x => x.id === t.id)) templates.push(t);
  const projIds = new Set(projects.map(p => p.id));
  let added = 0;
  let updated = 0;
  const tasks = current.tasks.map(t => {
    const inc = b.tasks.find(x => x.id === t.id);
    if (!inc) return t;
    const m = mergeTask(null, t, inc);
    if (m !== t) updated++;
    return m;
  });
  for (const inc of b.tasks) {
    if (tasks.some(t => t.id === inc.id)) continue;
    tasks.push({ ...inc, proj: inc.proj && projIds.has(inc.proj) ? inc.proj : null });
    added++;
  }
  return { tasks, projects, templates, added, updated };
}
