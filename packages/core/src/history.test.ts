import { DAY_MS, newTask } from './model';
import { diffTask, withHistory, historyByDay, historyText, HISTORY_CAP } from './history';

const now = new Date(2026, 8, 9, 12).getTime();
const base = newTask({ id: 'a', title: 'Draft model', pr: 1, proj: 'p1', tags: ['x'] }, now);
const projects = [{ id: 'p1', name: 'Research', color: '#000' }, { id: 'p2', name: 'Build', color: '#111' }];

describe('history', () => {
  it('newTask starts with a created entry', () => {
    expect(base.history.map(h => h.kind)).toEqual(['created']);
    expect(base.history[0].at).toBe(now);
  });

  it('diffTask reports every changed field with from/to', () => {
    const next = {
      ...base, status: 'focus' as const, pr: 0 as const, due: now + DAY_MS, title: 'Draft data model', note: 'n', proj: 'p2',
      tags: ['x', 'y'], recur: 'weekly' as const, remindDays: 0 as const,
      comments: [{ id: 'c', text: 'hi', at: now }], files: [{ id: 'f', name: 'a.png', kind: 'img' as const }],
    };
    const entries = diffTask(base, next, now + 1);
    expect(entries.map(e => e.kind)).toEqual(['status', 'priority', 'due', 'title', 'note', 'project', 'tags', 'recur', 'remind', 'comment', 'file']);
    const lines = entries.map(e => historyText(e, 'en', projects));
    expect(lines[0]).toEqual({ label: 'Status', detail: 'Inbox → In focus' });
    expect(lines[1].detail).toBe('Medium → High');
    expect(lines[5].detail).toBe('Research → Build');
    expect(lines[6].detail).toBe('#x → #x #y');
    expect(lines[9].detail).toBe('hi');
    expect(lines[10].detail).toBe('a.png');
  });

  it('done, archive, restore, reopen, snooze and bump map to their own kinds', () => {
    expect(diffTask(base, { ...base, status: 'done' }, now)[0].kind).toBe('done');
    expect(diffTask(base, { ...base, status: 'archived' }, now)[0].kind).toBe('archived');
    expect(diffTask({ ...base, status: 'archived' }, { ...base, status: 'inbox' }, now)[0].kind).toBe('restored');
    expect(diffTask({ ...base, status: 'done' }, { ...base, status: 'focus' }, now)[0].kind).toBe('reopened');
    expect(diffTask(base, { ...base, touched: now + 5 }, now)[0].kind).toBe('bumped');
    expect(diffTask(base, { ...base, snoozedUntil: now + DAY_MS }, now)[0].kind).toBe('snoozed');
    expect(diffTask(base, base, now)).toEqual([]);
    expect(historyText(diffTask(base, { ...base, status: 'done' }, now)[0], 'ru').label).toBe('Завершена');
  });

  it('withHistory appends, keeps a source, and caps the log', () => {
    const t = withHistory(base, { ...base, pr: 0 }, now + 10, 'calendar');
    expect(t.history.length).toBe(2);
    expect(t.history[1]).toMatchObject({ kind: 'priority', source: 'calendar', from: '1', to: '0' });
    expect(withHistory(base, base, now)).toBe(base);
    let long = base;
    for (let i = 0; i < HISTORY_CAP + 20; i++) long = withHistory(long, { ...long, pr: ((i + 2) % 3) as 0 | 1 | 2 }, now + i);
    expect(long.history.length).toBe(HISTORY_CAP);
  });

  it('groups by day, newest first', () => {
    const t1 = withHistory(base, { ...base, pr: 0 }, now - DAY_MS);
    const t = withHistory(t1, { ...t1, pr: 2 }, now + 60_000);
    const g = historyByDay(t.history);
    expect(g.length).toBe(2);
    expect(g[0].entries.map(e => e.kind)).toEqual(['priority', 'created']);
    expect(g[1].entries.map(e => e.kind)).toEqual(['priority']);
  });
});
