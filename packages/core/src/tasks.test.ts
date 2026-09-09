import { newTask, DAY_MS } from './model';
import { idleDays, isStale, dueLabel, sortAutoBump, dueDiff, matchesFilter, sortDone, archived } from './tasks';
import { sizeHuman, fmtDate, commentTime } from './dates';

// Wednesday 2026-09-09 12:00 local
const now = new Date(2026, 8, 9, 12).getTime();
const mk = (idle: number, extra: Partial<Parameters<typeof newTask>[0]> = {}) =>
  newTask({ title: 't', touched: now - idle * DAY_MS, created: now - (idle + 4) * DAY_MS, ...extra }, now);

describe('idle & stale', () => {
  it('counts whole idle days', () => {
    expect(idleDays(mk(0), now)).toBe(0);
    expect(idleDays(mk(2), now)).toBe(2);
    expect(idleDays(mk(12), now)).toBe(12);
  });
  it('stale at >= 7 days unless done or snoozed', () => {
    expect(isStale(mk(6), now)).toBe(false);
    expect(isStale(mk(7), now)).toBe(true);
    expect(isStale(mk(9, { status: 'done' }), now)).toBe(false);
    expect(isStale(mk(9, { snoozedUntil: now + DAY_MS }), now)).toBe(false);
    expect(isStale(mk(9, { snoozedUntil: now - DAY_MS }), now)).toBe(true);
  });
});

describe('due labels', () => {
  it('relative labels', () => {
    expect(dueLabel(mk(0, { due: now - DAY_MS }), 'en', now)).toBe('overdue');
    expect(dueLabel(mk(0, { due: now }), 'en', now)).toBe('today');
    expect(dueLabel(mk(0, { due: now + DAY_MS }), 'en', now)).toBe('tomorrow');
    expect(dueLabel(mk(0, { due: now + 2 * DAY_MS }), 'en', now)).toBe('Fri 11');
    expect(dueLabel(mk(0, { due: now + 11 * DAY_MS }), 'en', now)).toBe('Sep 20');
    expect(dueLabel(mk(0, { due: now + 11 * DAY_MS }), 'ru', now)).toBe('20 сен');
    expect(dueLabel(mk(0), 'en', now)).toBeNull();
  });
  it('dueDiff uses day boundaries', () => {
    expect(dueDiff(mk(0, { due: now + 3 * 3600e3 }), now)).toBe(0);
  });
});

describe('formatting', () => {
  it('sizeHuman', () => {
    expect(sizeHuman(18400)).toBe('18 KB');
    expect(sizeHuman(240000)).toBe('240 KB');
    expect(sizeHuman(960000)).toBe('1.0 MB');
    expect(sizeHuman(200)).toBe('1 KB');
  });
  it('fmtDate & commentTime', () => {
    expect(fmtDate(now, 'en')).toBe('Sep 9');
    expect(fmtDate(now, 'ru')).toBe('9 сен');
    expect(commentTime(now - 1000, 'en', now)).toBe('just now');
    expect(commentTime(now - 3600e3, 'ru', now)).toBe('сегодня');
    expect(commentTime(now - 5 * DAY_MS, 'en', now)).toBe('Sep 4');
  });
});

describe('sorting & filtering', () => {
  it('auto-bump puts stale (oldest first) ahead, then priority', () => {
    const a = mk(1, { id: 'a', pr: 2 }), b = mk(12, { id: 'b', pr: 1 }), c = mk(9, { id: 'c', pr: 0 }), d = mk(0, { id: 'd', pr: 0 });
    expect(sortAutoBump([a, b, c, d], now).map(t => t.id)).toEqual(['b', 'c', 'd', 'a']);
  });
  it('done sorted newest first, capped', () => {
    const list = [1, 2, 3].map(i => mk(0, { id: 'd' + i, status: 'done', doneAt: now - i * DAY_MS }));
    expect(sortDone(list, 2).map(t => t.id)).toEqual(['d1', 'd2']);
  });
  it('archived list is newest first with touched fallback', () => {
    const a = mk(3, { id: 'a', status: 'archived', archivedAt: now - 2 * DAY_MS });
    const b = mk(1, { id: 'b', status: 'archived', archivedAt: now - DAY_MS });
    const c = mk(0, { id: 'c', status: 'archived' }); // no archivedAt → touched = now
    const d = mk(0, { id: 'd' });
    expect(archived([a, b, c, d]).map(t => t.id)).toEqual(['c', 'b', 'a']);
  });
  it('matchesFilter', () => {
    const t = mk(0, { title: 'Compare vector DBs', tags: ['infra'], pr: 0, proj: 'p2' });
    expect(matchesFilter(t, 'INFRA', null, null)).toBe(true);
    expect(matchesFilter(t, '', 1, null)).toBe(false);
    expect(matchesFilter(t, '', null, 'p1')).toBe(false);
    expect(matchesFilter(t, 'vector', 0, 'p2')).toBe(true);
  });
});
