import { DAY_MS, newTask } from './model';
import { nextOccurrence, nextDueAfterCompletion, rollRecurring, recurringTasks, seriesHistory } from './recurring';

const now = new Date(2026, 8, 9, 12).getTime(); // Wed Sep 9
const day = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12).getTime();

describe('recurring', () => {
  it('nextOccurrence handles daily, weekly and month-end clamping', () => {
    expect(new Date(nextOccurrence(day(2026, 9, 9), 'daily')).getDate()).toBe(10);
    expect(new Date(nextOccurrence(day(2026, 9, 9), 'weekly')).getDate()).toBe(16);
    const jan31 = nextOccurrence(day(2026, 1, 31), 'monthly');
    expect([new Date(jan31).getMonth(), new Date(jan31).getDate()]).toEqual([1, 28]);
    const mar31 = nextOccurrence(day(2026, 3, 31), 'monthly');
    expect([new Date(mar31).getMonth(), new Date(mar31).getDate()]).toEqual([3, 30]);
  });
  it('nextDueAfterCompletion skips past slots and starts from today when undated', () => {
    const overdue = newTask({ title: 'w', recur: 'weekly', due: now - 20 * DAY_MS }, now);
    expect(new Date(nextDueAfterCompletion(overdue, now)).getDate()).toBe(10); // Aug 20 → Aug 27 → Sep 3 → Sep 10 (first slot after today)
    const undated = newTask({ title: 'd', recur: 'daily' }, now);
    expect(new Date(nextDueAfterCompletion(undated, now)).getDate()).toBe(10);
  });
  it('rollRecurring closes the original and creates the next instance in the same column', () => {
    const t = newTask({ id: 'r', title: 'Water plants', recur: 'weekly', due: now, status: 'focus', pr: 2, tags: ['home'], remindDays: 0 }, now);
    const { done, next } = rollRecurring(t, now);
    expect(done).toMatchObject({ id: 'r', status: 'done', doneAt: now });
    expect(next.id).not.toBe('r');
    expect(next).toMatchObject({ title: 'Water plants', status: 'focus', recur: 'weekly', pr: 2, tags: ['home'], remindDays: 0, doneAt: null });
    expect(new Date(next.due!).getDate()).toBe(16);
    expect(recurringTasks([done, next]).map(x => x.id)).toEqual([next.id]);
    expect(seriesHistory([done, next], next).map(x => x.id)).toEqual(['r']);
  });
});
