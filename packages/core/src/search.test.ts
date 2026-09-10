import { newTask } from './model';
import { searchTasks, highlight, excerpt, tokenize } from './search';

const now = Date.now();
const projects = [{ id: 'p1', name: 'AI Research', color: 'x' }, { id: 'p2', name: 'Home Ops', color: 'y' }];
const tasks = [
  newTask({ id: 'a', title: 'Compare vector DBs', proj: 'p1', tags: ['infra', 'claude'], note: 'Pinecone vs pgvector. Need a call.', touched: now - 1000 }, now),
  newTask({ id: 'b', title: 'Renew domain', proj: 'p2', comments: [{ id: 'c', text: 'Registrar said vector something', at: now }], touched: now }, now),
  newTask({ id: 'c', title: 'Old idea', status: 'archived', note: 'about vectors', archivedAt: now }, now),
  newTask({ id: 'd', title: 'Dentist', pr: 2 }, now),
];

describe('search', () => {
  it('tokenizes and strips hashes', () => {
    expect(tokenize('  #Infra vector, DBs ')).toEqual(['infra', 'vector', 'dbs']);
    expect(searchTasks(tasks, projects, '   ')).toEqual([]);
  });
  it('matches across fields, ranks title first and reports fields + snippet', () => {
    const hits = searchTasks(tasks, projects, 'vector');
    expect(hits.map(h => h.task.id)).toEqual(['a', 'c', 'b']);
    expect(hits[0].fields).toEqual(['title', 'note']);
    expect(hits[0].snippet).toEqual({ field: 'note', text: 'Pinecone vs pgvector. Need a call.' });
    expect(hits[2].fields).toEqual(['comment']);
    expect(hits[2].snippet!.field).toBe('comment');
  });
  it('all words must appear, possibly in different fields', () => {
    expect(searchTasks(tasks, projects, 'vector claude').map(h => h.task.id)).toEqual(['a']);
    expect(searchTasks(tasks, projects, 'research compare').map(h => h.task.id)).toEqual(['a']);
    expect(searchTasks(tasks, projects, 'vector nothing')).toEqual([]);
  });
  it('filters by status, priority and project', () => {
    expect(searchTasks(tasks, projects, 'vector', { statuses: ['archived'] }).map(h => h.task.id)).toEqual(['c']);
    expect(searchTasks(tasks, projects, 'vector', { statuses: ['inbox'] }).map(h => h.task.id)).toEqual(['a', 'b']);
    expect(searchTasks(tasks, projects, 'dentist', { priority: 2 }).length).toBe(1);
    expect(searchTasks(tasks, projects, 'dentist', { priority: 0 }).length).toBe(0);
    expect(searchTasks(tasks, projects, 'vector', { proj: 'p2' }).map(h => h.task.id)).toEqual(['b']);
    expect(searchTasks(tasks, projects, 'vector', { limit: 1 }).length).toBe(1);
  });
  it('highlight and excerpt', () => {
    expect(highlight('Compare vector DBs', ['vector'])).toEqual([{ text: 'Compare ', hit: false }, { text: 'vector', hit: true }, { text: ' DBs', hit: false }]);
    expect(highlight('abc', [])).toEqual([{ text: 'abc', hit: false }]);
    const long = 'x'.repeat(100) + ' needle ' + 'y'.repeat(100);
    const e = excerpt(long, ['needle'], 10);
    expect(e.startsWith('…')).toBe(true);
    expect(e.endsWith('…')).toBe(true);
    expect(e).toContain('needle');
  });
});
