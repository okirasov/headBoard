import { DAY_MS, newTask } from './model';
import { weeklyActivity, priorityMix, openByProject, idleBuckets, completionStreak, medianDaysToClose, statsSummary, startOfWeek } from './stats';

const now = new Date(2026, 8, 9, 12).getTime(); // Wednesday
const mk = (p: Partial<Parameters<typeof newTask>[0]>) => newTask({ title: 't', ...p }, now);

describe('stats', () => {
  it('weeks start on Monday and count closed/created', () => {
    const mon = startOfWeek(now);
    expect(new Date(mon).getDay()).toBe(1);
    const tasks = [
      mk({ status: 'done', doneAt: now - DAY_MS, created: now - 3 * DAY_MS }),       // this week
      mk({ status: 'done', doneAt: now - 8 * DAY_MS, created: now - 20 * DAY_MS }),  // last week
      mk({ created: now - 2 * DAY_MS }),
    ];
    const w = weeklyActivity(tasks, now, 3);
    expect(w.length).toBe(3);
    expect(w[2].isCurrent).toBe(true);
    expect(w[2].closed).toBe(1);
    expect(w[2].created).toBe(1); // now−3d is Sunday of the previous week, now−2d is this Monday
    expect(w[1].created).toBe(1);
    expect(w[1].closed).toBe(1);
    expect(w[0].closed).toBe(0);
  });
  it('priority mix and idle buckets ignore done and archived', () => {
    const tasks = [mk({ pr: 0 }), mk({ pr: 0, touched: now - 3 * DAY_MS }), mk({ pr: 2, touched: now - 20 * DAY_MS }), mk({ pr: 1, status: 'done', doneAt: now }), mk({ pr: 1, status: 'archived' })];
    expect(priorityMix(tasks)).toEqual({ counts: { 0: 2, 1: 0, 2: 1 }, total: 3 });
    expect(idleBuckets(tasks, now).map(b => b.count)).toEqual([1, 1, 0, 1]);
  });
  it('openByProject sorts by open count and appends no-project bucket', () => {
    const projects = [{ id: 'a', name: 'A', color: 'x' }, { id: 'b', name: 'B', color: 'y' }];
    const tasks = [mk({ proj: 'b' }), mk({ proj: 'b' }), mk({ proj: 'a', status: 'done', doneAt: now }), mk({ proj: null })];
    const rows = openByProject(tasks, projects);
    expect(rows.map(r => r.id)).toEqual(['b', 'a', null]);
    expect(rows[0].open).toBe(2);
    expect(rows[1].done).toBe(1);
  });
  it('streak counts consecutive completion days, tolerating an empty today', () => {
    const tasks = [1, 2, 3].map(d => mk({ status: 'done', doneAt: now - d * DAY_MS }));
    expect(completionStreak(tasks, now)).toBe(3);
    expect(completionStreak([...tasks, mk({ status: 'done', doneAt: now })], now)).toBe(4);
    expect(completionStreak([mk({ status: 'done', doneAt: now - 5 * DAY_MS })], now)).toBe(0);
  });
  it('median days to close and summary', () => {
    const tasks = [
      mk({ status: 'done', doneAt: now, created: now - 2 * DAY_MS }),
      mk({ status: 'done', doneAt: now, created: now - 4 * DAY_MS }),
      mk({ status: 'done', doneAt: now, created: now - 10 * DAY_MS }),
      mk({ touched: now - 9 * DAY_MS }),
    ];
    expect(medianDaysToClose(tasks)).toBe(4);
    expect(medianDaysToClose([mk({})])).toBeNull();
    const s = statsSummary(tasks, now);
    expect(s).toMatchObject({ openN: 1, closedWeek: 3, staleN: 1, medianClose: 4 });
    expect(s.streak).toBe(1);
  });
});
