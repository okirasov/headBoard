import { DAY_MS, newTask } from './model';
import { buildMonthGrid, buildSnoozeGrid, snoozePresets } from './calendar';
import { startOfDay } from './dates';

const now = new Date(2026, 8, 9, 12).getTime(); // Wed Sep 9 2026
const today = startOfDay(now);

describe('buildMonthGrid', () => {
  it('starts on Monday and has 42 cells', () => {
    const g = buildMonthGrid([], { now, selected: null });
    expect(g.length).toBe(6);
    expect(g.flatMap(w => w.days).length).toBe(42);
    expect(new Date(g[0].days[0].ts).getDay()).toBe(1);
    expect(g[0].days[0].n).toBe(31); // Aug 31 2026 is Monday
  });
  it('flags today, counts open same-day tasks, heavy >= 3', () => {
    const due = today + 2 * DAY_MS;
    const tasks = [
      newTask({ title: 'a', due }, now), newTask({ title: 'b', due: due + 3600e3 }, now),
      newTask({ title: 'c', due }, now), newTask({ title: 'done', due, status: 'done' }, now),
      newTask({ title: 'arch', due, status: 'archived' }, now),
    ];
    const days = buildMonthGrid(tasks, { now, selected: due }).flatMap(w => w.days);
    const t = days.find(d => d.isToday)!;
    expect(t.n).toBe(9);
    const d = days.find(d => d.ts === due)!;
    expect(d.count).toBe(3);
    expect(d.heavy).toBe(true);
    expect(d.isSelected).toBe(true);
    expect(d.isFuture).toBe(true);
  });
});

describe('buildSnoozeGrid', () => {
  it('disables today and past', () => {
    const days = buildSnoozeGrid({ now, monthOffset: 0 }).flatMap(w => w.days);
    expect(days.find(d => d.isToday)!.disabled).toBe(true);
    expect(days.find(d => d.ts === today + DAY_MS)!.disabled).toBe(false);
  });
  it('offsets month', () => {
    const days = buildSnoozeGrid({ now, monthOffset: 1 }).flatMap(w => w.days);
    expect(days.filter(d => d.inMonth).length).toBe(31); // October
  });
});

describe('snoozePresets', () => {
  it('returns start-of-day timestamps', () => {
    const p = snoozePresets(now);
    expect(p.map(x => x.key)).toEqual(['tomorrow', 'd3', 'week', 'month']);
    expect(p[0].ts).toBe(today + DAY_MS);
    expect(p[2].ts).toBe(today + 7 * DAY_MS);
    expect(new Date(p[3].ts).getMonth()).toBe(9);
    expect(new Date(p[3].ts).getHours()).toBe(0);
  });
});
