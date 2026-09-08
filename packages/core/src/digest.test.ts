import { DAY_MS, newTask } from './model';
import { digestStats, cannedDigest, digestStatsLine } from './digest';
import { heuristicExtract, parseExtractResponse } from './capture';

const now = new Date(2026, 8, 9, 12).getTime();
const projects = [{ id: 'p1', name: 'AI Research', color: 'x' }, { id: 'p4', name: 'Home Ops', color: 'y' }];

describe('digestStats', () => {
  it('aggregates due, stale, done this week', () => {
    const tasks = [
      newTask({ title: 'Due now', due: now, status: 'focus' }, now),
      newTask({ title: 'Overdue', due: now - DAY_MS }, now),
      newTask({ title: 'Old', touched: now - 15 * DAY_MS }, now),
      newTask({ title: 'Older', touched: now - 20 * DAY_MS, status: 'waiting' }, now),
      newTask({ title: 'Done', status: 'done', doneAt: now - DAY_MS }, now),
      newTask({ title: 'Done long ago', status: 'done', doneAt: now - 10 * DAY_MS }, now),
      newTask({ title: 'Weekly', recur: 'weekly' }, now),
      newTask({ title: 'Archived', status: 'archived', touched: now - 30 * DAY_MS }, now),
    ];
    const s = digestStats(tasks, now);
    expect(s.dueN).toBe(2);
    expect(s.dueFirst).toBe('Due now');
    expect(s.staleN).toBe(2);
    expect(s.oldT).toBe('Older');
    expect(s.oldI).toBe(20);
    expect(s.doneW).toBe(1);
    expect(s.focusN).toBe(1);
    expect(s.recN).toBe(1);
    expect(cannedDigest(0, s, 'en')).toContain('Due now');
    expect(cannedDigest(3, s, 'ru')).toContain('На сегодня');
    expect(digestStatsLine(s, 'en')).toBe('2 due today · 2 forgotten · 1 closed this week');
  });
});

describe('heuristicExtract', () => {
  it('splits, strips bullets, detects urgency, tags and project', () => {
    const items = heuristicExtract('- figure out pricing page copy\n— urgent: renew domain\n* ask Claude about embeddings #research #ai #extra\nx', projects);
    expect(items.length).toBe(3);
    expect(items[0]).toEqual({ title: 'Figure out pricing page copy', pr: 1, tags: [], proj: null });
    expect(items[1].title).toBe('Renew domain');
    expect(items[1].pr).toBe(0);
    expect(items[1].proj).toBe('p4');
    expect(items[2].tags).toEqual(['research', 'ai']);
    expect(items[2].proj).toBe('p1');
  });
  it('caps at 8 items and 90 chars', () => {
    const items = heuristicExtract(Array.from({ length: 10 }, (_, i) => 'task ' + i + ' ' + 'x'.repeat(100)).join('\n'), projects);
    expect(items.length).toBe(8);
    expect(items[0].title.length).toBe(90);
  });
  it('parses model JSON', () => {
    const r = parseExtractResponse('Sure: [{"title":"Do it","priority":2,"tags":["a","b","c"],"project":"Home Ops"},{"title":""}]', projects);
    expect(r).toEqual([{ title: 'Do it', pr: 2, tags: ['a', 'b'], proj: 'p4' }]);
    expect(parseExtractResponse('garbage', projects)).toEqual([]);
  });
});
