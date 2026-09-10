import { newTask } from './model';
import { newTemplate } from './templates';
import { backupFilename, exportBackup, mergeBackup, parseBackup } from './backup';

const now = new Date(2026, 8, 11, 10).getTime();
const p1 = { id: 'p1', name: 'Research', color: '#111' };
const a = newTask({ id: 'a', title: 'Keep me', proj: 'p1', touched: now - 1000 }, now);

describe('backup', () => {
  it('round-trips through export → parse', () => {
    const tpl = newTemplate({ name: 'Call', title: 'Call {who}' });
    const json = JSON.stringify(exportBackup({ tasks: [a], projects: [p1], templates: [tpl] }, now));
    const b = parseBackup(json, now)!;
    expect(b.app).toBe('headboard');
    expect(b.tasks[0]).toEqual(a);
    expect(b.projects).toEqual([p1]);
    expect(b.templates[0].title).toBe('Call {who}');
    expect(backupFilename(now)).toBe('headboard-2026-09-11.json');
  });

  it('rejects foreign files and fills defaults for sparse tasks', () => {
    expect(parseBackup('not json', now)).toBeNull();
    expect(parseBackup('{"app":"other","tasks":[]}', now)).toBeNull();
    const b = parseBackup('{"app":"headboard","tasks":[{"id":"x","title":"Sparse"},{"title":"no id"},7]}', now)!;
    expect(b.tasks).toHaveLength(1);
    expect(b.tasks[0]).toMatchObject({ id: 'x', title: 'Sparse', status: 'inbox', pr: 1, tags: [], history: [expect.objectContaining({ kind: 'created' })], seriesId: null });
  });

  it('merges by id: adds unknown, keeps the newer touched, detaches unknown projects', () => {
    const newerA = { ...a, title: 'Keep me (edited elsewhere)', touched: now + 5000 };
    const older = { ...a, title: 'stale copy', touched: now - 9000 };
    const fresh = newTask({ id: 'n', title: 'New from backup', proj: 'ghost' }, now);
    const r1 = mergeBackup({ tasks: [a], projects: [p1], templates: [] }, { app: 'headboard', version: 1, exportedAt: now, tasks: [newerA, fresh], projects: [{ id: 'p2', name: 'Build', color: '#222' }], templates: [] });
    expect(r1.tasks.find(t => t.id === 'a')!.title).toBe('Keep me (edited elsewhere)');
    expect(r1.tasks.find(t => t.id === 'n')!.proj).toBeNull();
    expect(r1.projects.map(p => p.id)).toEqual(['p1', 'p2']);
    expect([r1.added, r1.updated]).toEqual([1, 1]);
    const r2 = mergeBackup({ tasks: [a], projects: [p1], templates: [] }, { app: 'headboard', version: 1, exportedAt: now, tasks: [older], projects: [{ ...p1, name: 'Renamed' }], templates: [] });
    expect(r2.tasks[0].title).toBe('Keep me'); // current is newer
    expect(r2.projects[0].name).toBe('Research'); // current project kept
    expect([r2.added, r2.updated]).toEqual([0, 0]);
  });
});
