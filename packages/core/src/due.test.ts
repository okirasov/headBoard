import { DAY_MS, newTask } from './model';
import { dueGroups, undated, dueReminderTargets } from './due';

const now = new Date(2026, 8, 9, 12).getTime();
const mk = (p: Partial<Parameters<typeof newTask>[0]>) => newTask({ title: 't', ...p }, now);

describe('due', () => {
  it('groups by distance and sorts by due then priority', () => {
    const tasks = [
      mk({ id: 'later', due: now + 20 * DAY_MS }), mk({ id: 'wk', due: now + 4 * DAY_MS }), mk({ id: 'tmr', due: now + DAY_MS }),
      mk({ id: 'today-lo', due: now, pr: 2 }), mk({ id: 'today-hi', due: now, pr: 0 }), mk({ id: 'over', due: now - 3 * DAY_MS }),
      mk({ id: 'done', due: now, status: 'done' }), mk({ id: 'arch', due: now, status: 'archived' }), mk({ id: 'nodate' }),
    ];
    const g = Object.fromEntries(dueGroups(tasks, now).map(x => [x.key, x.tasks.map(t => t.id)]));
    expect(g).toEqual({ overdue: ['over'], today: ['today-hi', 'today-lo'], tomorrow: ['tmr'], week: ['wk'], later: ['later'] });
    expect(undated(tasks).map(t => t.id)).toEqual(['nodate']);
  });
  it('reminder targets: on the day, the day before, and overdue with a reminder', () => {
    const tasks = [
      mk({ id: 'a', due: now, remindDays: 0 }),
      mk({ id: 'b', due: now + DAY_MS, remindDays: 1 }),
      mk({ id: 'c', due: now + DAY_MS, remindDays: 0 }),
      mk({ id: 'd', due: now - DAY_MS, remindDays: 0 }),
      mk({ id: 'e', due: now, remindDays: null }),
      mk({ id: 'f', due: now, remindDays: 0, status: 'done' }),
    ];
    expect(dueReminderTargets(tasks, now).map(t => t.id)).toEqual(['d', 'a', 'b']);
  });
});
