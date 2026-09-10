import { useStore } from './useStore';
import { newTask, DAY_MS } from '@headboard/core';

const now = Date.now();
const reset = () => useStore.setState({
  tasks: [
    newTask({ id: 'a', title: 'A', status: 'inbox', touched: now - 9 * DAY_MS, snoozedUntil: now + DAY_MS }, now),
    newTask({ id: 'b', title: 'B', status: 'done', doneAt: now - DAY_MS }, now),
  ],
  projects: [], projFiles: {}, sel: 'a', snack: null, lang: 'en', user: null,
});

beforeEach(reset);

describe('store', () => {
  it('moveTask sets status, touched and doneAt', () => {
    useStore.getState().moveTask('a', 'done');
    const t = useStore.getState().tasks.find(t => t.id === 'a')!;
    expect(t.status).toBe('done');
    expect(t.doneAt).not.toBeNull();
    expect(t.touched).toBeGreaterThan(now - 1000);
    expect(useStore.getState().snack).toBe('Done — moved to Done'); // moving to Done goes through complete()
  });
  it('bump resets idle and snooze', () => {
    useStore.getState().bump('a');
    const t = useStore.getState().tasks.find(t => t.id === 'a')!;
    expect(t.snoozedUntil).toBe(0);
    expect(t.touched).toBeGreaterThan(now - 1000);
  });
  it('toggleDone reopens into focus', () => {
    useStore.getState().toggleDone('b');
    const t = useStore.getState().tasks.find(t => t.id === 'b')!;
    expect(t.status).toBe('focus');
    expect(t.doneAt).toBeNull();
  });
  it('addTasks prepends inbox tasks and closes capture', () => {
    useStore.setState({ capOpen: true, capText: 'x', capItems: [] });
    useStore.getState().addTasks([{ title: 'New', pr: 0, tags: ['t'], proj: null }, { title: 'New2', pr: 1, tags: [], proj: 'p' }]);
    const s = useStore.getState();
    expect(s.tasks.length).toBe(4);
    expect(s.tasks[0].title).toBe('New');
    expect(s.tasks[0].status).toBe('inbox');
    expect(s.capOpen).toBe(false);
    expect(s.snack).toBe('2 tasks added to Inbox');
  });
  it('archive hides task and clears selection', () => {
    useStore.getState().archive('a');
    expect(useStore.getState().tasks.find(t => t.id === 'a')!.status).toBe('archived');
    expect(useStore.getState().sel).toBeNull();
  });
  it('archive stamps archivedAt, restore clears it, delete removes', () => {
    useStore.getState().archive('a');
    let t = useStore.getState().tasks.find(t => t.id === 'a')!;
    expect(t.archivedAt).toBeGreaterThan(now - 1000);
    useStore.getState().restore('a');
    t = useStore.getState().tasks.find(t => t.id === 'a')!;
    expect(t.status).toBe('inbox');
    expect(t.archivedAt).toBeNull();
    useStore.getState().deleteTask('a');
    expect(useStore.getState().tasks.find(t => t.id === 'a')).toBeUndefined();
    expect(useStore.getState().snack).toBe('Deleted');
  });
  it('templates: save from task, use with placeholders, delete', () => {
    useStore.getState().patchTask('a', { title: 'Prep call with {client}', tags: ['sales'], note: 'Agenda: {client}' });
    useStore.getState().saveAsTemplate('a');
    const tpl = useStore.getState().templates[0];
    expect(tpl).toMatchObject({ name: 'Prep call with {client}', tags: ['sales'] });
    useStore.getState().updateTemplate(tpl.id, { dueInDays: 2 });
    const task = useStore.getState().useTemplate(tpl.id, { client: 'Acme' })!;
    expect(task.title).toBe('Prep call with Acme');
    expect(task.note).toBe('Agenda: Acme');
    expect(task.due).not.toBeNull();
    const s = useStore.getState();
    expect(s.templates[0].usedCount).toBe(1);
    expect(s.sel).toBe(task.id);
    expect(s.tasks[0].id).toBe(task.id);
    useStore.getState().deleteTemplate(tpl.id);
    expect(useStore.getState().templates).toEqual([]);
  });
  it('tags: set normalizes, rename merges, delete strips and clears the filter', () => {
    useStore.getState().setTags('a', ['#Infra', 'infra', 'Deep Work']);
    expect(useStore.getState().tasks.find(t => t.id === 'a')!.tags).toEqual(['infra', 'deep-work']);
    useStore.getState().setTags('b', ['ops']);
    useStore.setState({ fTag: 'infra' });
    useStore.getState().renameTag('infra', 'ops');
    expect(useStore.getState().tasks.find(t => t.id === 'a')!.tags).toEqual(['ops', 'deep-work']);
    expect(useStore.getState().fTag).toBe('ops');
    expect(useStore.getState().snack).toBe('Tags merged');
    useStore.getState().deleteTag('ops');
    expect(useStore.getState().tasks.every(t => !t.tags.includes('ops'))).toBe(true);
    expect(useStore.getState().fTag).toBeNull();
  });
  it('completing a recurring task rolls it forward', () => {
    useStore.getState().setRecur('a', 'weekly');
    let t = useStore.getState().tasks.find(x => x.id === 'a')!;
    expect(t.recur).toBe('weekly');
    expect(t.due).not.toBeNull(); // undated → due today
    useStore.getState().markDone('a');
    const s = useStore.getState();
    const done = s.tasks.find(x => x.id === 'a')!;
    const next = s.tasks.find(x => x.id !== 'a' && x.id !== 'b' && x.recur === 'weekly')!;
    expect(done.status).toBe('done');
    expect(next.status).toBe('inbox');
    expect(next.due! > done.due!).toBe(true);
    expect(s.snack!.startsWith('Done — next on ')).toBe(true);
  });
  it('projects: add, rename, delete detaches tasks', () => {
    const p = useStore.getState().addProject('  Writing ', '#6B7FA3')!;
    expect(p.name).toBe('Writing');
    useStore.getState().updateProject(p.id, { name: 'Essays', color: 'var(--acc)' });
    expect(useStore.getState().projects[0]).toMatchObject({ name: 'Essays', color: 'var(--acc)' });
    useStore.getState().patchTask('a', { proj: p.id });
    useStore.setState({ fProj: p.id, projFiles: { [p.id]: [{ id: 'f', name: 'x', kind: 'file' }] } });
    useStore.getState().deleteProject(p.id);
    const s = useStore.getState();
    expect(s.projects).toEqual([]);
    expect(s.tasks.find(t => t.id === 'a')!.proj).toBeNull();
    expect(s.fProj).toBeNull();
    expect(s.projFiles[p.id]).toBeUndefined();
    expect(useStore.getState().addProject('   ', '#000')).toBeNull();
  });
  it('comments and files', () => {
    useStore.getState().addComment('a', '  hello ');
    useStore.getState().addComment('a', '   ');
    expect(useStore.getState().tasks[0].comments.map(c => c.text)).toEqual(['hello']);
    useStore.getState().attachFiles('a', [{ id: 'f1', name: 'x.pdf', kind: 'file', size: 1000 }]);
    expect(useStore.getState().tasks[0].files.length).toBe(1);
    useStore.getState().removeFile('a', 'f1');
    expect(useStore.getState().tasks[0].files.length).toBe(0);
  });
  it('signIn/signOut', () => {
    useStore.getState().signIn('Apple');
    expect(useStore.getState().user).toMatchObject({ provider: 'Apple', initials: 'SK', email: 'sam.kern@icloud.com' });
    useStore.getState().signOut();
    expect(useStore.getState().user).toBeNull();
    expect(useStore.getState().sel).toBeNull();
  });
});
