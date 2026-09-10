import { newTask } from './model';
import { mergeTask, mergeById, taskDelta } from './merge';

const now = 1_800_000_000_000;
const base = newTask({ id: 'm', title: 'Plan trip', pr: 1, tags: ['home'], touched: now, comments: [{ id: 'c1', text: 'first', at: now }], files: [{ id: 'f1', name: 'a.png', kind: 'img' }] }, now);

describe('mergeTask', () => {
  it('keeps one-sided changes from both devices', () => {
    const local = { ...base, note: 'packed list', touched: now + 10 };
    const server = { ...base, due: now + 864e5, touched: now + 20 };
    const m = mergeTask(base, local, server);
    expect(m.note).toBe('packed list');
    expect(m.due).toBe(now + 864e5);
    expect(m.touched).toBe(now + 20);
  });

  it('resolves a field changed on both sides by the newer touched', () => {
    const local = { ...base, pr: 0 as const, touched: now + 50 };
    const server = { ...base, pr: 2 as const, touched: now + 20 };
    expect(mergeTask(base, local, server).pr).toBe(0);
    expect(mergeTask(base, { ...local, touched: now + 5 }, server).pr).toBe(2);
  });

  it('merges comments, files and history by id, honouring deletions', () => {
    const local = { ...base, comments: [...base.comments, { id: 'c2', text: 'local add', at: now + 2 }], files: [], history: [...base.history, { id: 'hl', at: now + 2, kind: 'comment' as const }] };
    const server = { ...base, comments: [{ id: 'c3', text: 'server add', at: now + 1 }], files: [...base.files, { id: 'f2', name: 'b.pdf', kind: 'file' as const }], history: [...base.history, { id: 'hs', at: now + 1, kind: 'file' as const }] };
    const m = mergeTask(base, local, server);
    expect(m.comments.map(c => c.id)).toEqual(['c3', 'c2']); // c1 deleted on the server, both additions kept, sorted by time
    expect(m.files.map(f => f.id)).toEqual(['f2']); // f1 removed locally, f2 added on the server
    expect(m.history.map(h => h.id)).toEqual([base.history[0].id, 'hs', 'hl']);
  });

  it('without a base the more recently touched version wins as a whole', () => {
    const local = { ...base, note: 'x', touched: now + 1 };
    const server = { ...base, due: 5, touched: now + 2 };
    expect(mergeTask(null, local, server)).toBe(server);
    const newer = { ...local, touched: now + 3 };
    expect(mergeTask(null, newer, server)).toBe(newer);
  });

  it('taskDelta sends only changed fields, comment upserts and removals', () => {
    const next = { ...base, note: 'n', touched: now + 1, comments: [{ id: 'c2', text: 'added', at: now + 1 }], history: [...base.history, { id: 'h2', at: now + 1, kind: 'note' as const }] };
    const d = taskDelta(base, next);
    expect(Object.keys(d.patch).sort()).toEqual(['comments', 'history', 'note', 'touched']);
    expect(d.patch.comments!.map(c => c.id)).toEqual(['c2']);
    expect(d.removedComments).toEqual(['c1']);
    expect(taskDelta(base, base)).toEqual({ patch: {}, removedComments: [] });
  });

  it('mergeById keeps additions from either side and drops what one side removed', () => {
    const b = [{ id: 'a' }, { id: 'b' }];
    expect(mergeById(b, [{ id: 'a' }, { id: 'c' }], [{ id: 'b' }, { id: 'd' }], x => x.id).map(x => x.id)).toEqual(['c', 'd']);
  });
});
