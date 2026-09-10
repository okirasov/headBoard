import { newTask } from './model';
import { normalizeTag, normalizeTags, tagStats, unusedTags, renameTag, removeTag, suggestTags } from './tags';

const now = 1_000_000;
const tasks = [
  newTask({ id: 'a', title: 'a', tags: ['infra', 'claude'], touched: 300 }, now),
  newTask({ id: 'b', title: 'b', tags: ['claude'], status: 'done', doneAt: now, touched: 200 }, now),
  newTask({ id: 'c', title: 'c', tags: ['essay'], status: 'archived', touched: 100 }, now),
  newTask({ id: 'd', title: 'd', tags: ['ux'], touched: 400 }, now),
];

describe('tags', () => {
  it('normalizes', () => {
    expect(normalizeTag('  #Deep Work! ')).toBe('deep-work');
    expect(normalizeTag('##Исследование')).toBe('исследование');
    expect(normalizeTag('--x--')).toBe('x');
    expect(normalizeTag('x'.repeat(40)).length).toBe(30);
    expect(normalizeTags(['A', 'a', '', '#b'])).toEqual(['a', 'b']);
  });
  it('stats, unused and suggestions', () => {
    const s = tagStats(tasks);
    expect(s.map(x => x.tag)).toEqual(['claude', 'infra', 'ux', 'essay']);
    expect(s[0]).toMatchObject({ open: 1, done: 1, archived: 0, total: 2, lastUsed: 300 });
    expect(unusedTags(s).map(x => x.tag)).toEqual(['essay']);
    expect(suggestTags(tasks, 'c')).toEqual(['claude']);
    expect(suggestTags(tasks, '', ['claude'])).toEqual(['infra', 'ux', 'essay']);
    expect(suggestTags(tasks, 'la')).toEqual(['claude']);
  });
  it('rename merges and dedupes, remove strips', () => {
    const changed = renameTag(tasks, 'infra', 'Claude');
    expect(changed.map(t => t.id)).toEqual(['a']);
    expect(changed[0].tags).toEqual(['claude']);
    expect(renameTag(tasks, 'infra', 'infra')).toEqual([]);
    expect(renameTag(tasks, 'infra', '#')).toEqual([]);
    const removed = removeTag(tasks, 'claude');
    expect(removed.map(t => t.id)).toEqual(['a', 'b']);
    expect(removed[0].tags).toEqual(['infra']);
  });
});
