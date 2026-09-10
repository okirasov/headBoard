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
  it('history: every mutation appends a diff entry, capture marks its source', () => {
    reset();
    const t = newTask({ id: 'h1', title: 'Log me', pr: 1 }, Date.now() - DAY_MS);
    useStore.setState({ tasks: [t] });
    const st = useStore.getState();
    st.setPriority('h1', 0);
    st.moveTask('h1', 'focus');
    st.setTags('h1', ['a']);
    st.addComment('h1', 'note to self');
    st.complete('h1');
    const kinds = useStore.getState().tasks[0].history.map(h => h.kind);
    expect(kinds).toEqual(['created', 'priority', 'status', 'tags', 'comment', 'done']);
    expect(useStore.getState().tasks[0].history[1]).toMatchObject({ from: '1', to: '0' });
    st.addTasks([{ title: 'Captured', proj: null, pr: 1, tags: [] }]);
    expect(useStore.getState().tasks[0].history[0]).toMatchObject({ kind: 'created', source: 'capture' });
  });

  it('editing: title, note, project, chat link, comments', () => {
    reset();
    useStore.setState({ tasks: [newTask({ id: 'e1', title: 'Old', pr: 1 }, Date.now())], projects: [{ id: 'p1', name: 'P', color: '#000' }] });
    const st = useStore.getState();
    st.setTitle('e1', '  New title  ');
    st.setTitle('e1', '   '); // ignored
    st.setNote('e1', 'a note');
    st.setProject('e1', 'p1');
    st.setProject('e1', 'nope'); // unknown project → cleared
    st.setChat('e1', 'https://claude.ai/chat/1');
    st.setChat('e1', 'javascript:alert(1)'); // rejected → null
    st.addComment('e1', 'first');
    const cid = useStore.getState().tasks[0].comments[0].id;
    st.editComment('e1', cid, 'first (edited)');
    let t = useStore.getState().tasks[0];
    expect(t).toMatchObject({ title: 'New title', note: 'a note', proj: null, chat: null });
    expect(t.comments[0].text).toBe('first (edited)');
    st.removeComment('e1', cid);
    t = useStore.getState().tasks[0];
    expect(t.comments).toEqual([]);
    expect(t.history.map(h => h.kind)).toEqual(['created', 'title', 'note', 'project', 'project', 'chat', 'chat', 'comment', 'comment_edited', 'comment_removed']);
  });

  it('undo puts back the exact previous task and drops what the action created', () => {
    reset();
    const t = newTask({ id: 'u1', title: 'Undo me', pr: 1, status: 'focus' }, Date.now() - DAY_MS);
    const r = newTask({ id: 'u2', title: 'Weekly', pr: 1, status: 'focus', recur: 'weekly', due: Date.now() }, Date.now() - DAY_MS);
    useStore.setState({ tasks: [t, r] });
    const st = useStore.getState();
    st.archive('u1');
    expect(useStore.getState().tasks.find(x => x.id === 'u1')!.status).toBe('archived');
    expect(useStore.getState().snackUndo).toBeTruthy();
    st.undo();
    expect(useStore.getState().tasks.find(x => x.id === 'u1')).toEqual(t); // same history, no archive entry
    expect(useStore.getState().snack).toBe('Undone');
    expect(useStore.getState().snackUndo).toBeNull();
    st.deleteTask('u1');
    expect(useStore.getState().tasks.map(x => x.id)).toEqual(['u2']);
    st.undo();
    expect(useStore.getState().tasks.map(x => x.id)).toEqual(['u1', 'u2']); // back in its place
    st.complete('u2');
    expect(useStore.getState().tasks).toHaveLength(3); // next instance created
    st.undo();
    expect(useStore.getState().tasks.map(x => x.id)).toEqual(['u1', 'u2']);
    expect(useStore.getState().tasks.find(x => x.id === 'u2')!.status).toBe('focus');
    st.toast('plain');
    expect(useStore.getState().snackUndo).toBeNull();
  });

  it('bulk actions apply to the selection with one undo', () => {
    reset();
    const a = newTask({ id: 'b1', title: 'A', pr: 1, status: 'inbox' }, Date.now());
    const b = newTask({ id: 'b2', title: 'B', pr: 1, status: 'inbox' }, Date.now());
    const c = newTask({ id: 'b3', title: 'C', pr: 1, status: 'inbox' }, Date.now());
    useStore.setState({ tasks: [a, b, c] });
    const st = useStore.getState();
    st.toggleSelect('b1'); st.toggleSelect('b2'); st.toggleSelect('b2'); st.toggleSelect('b2');
    expect(useStore.getState().selected).toEqual(['b1', 'b2']);
    st.bulkPriority(0);
    expect(useStore.getState().tasks.filter(t => t.pr === 0).map(t => t.id)).toEqual(['b1', 'b2']);
    st.bulkMove('focus');
    expect(useStore.getState().selected).toEqual([]);
    expect(useStore.getState().tasks.map(t => t.status)).toEqual(['focus', 'focus', 'inbox']);
    st.undo();
    expect(useStore.getState().tasks.map(t => t.status)).toEqual(['inbox', 'inbox', 'inbox']);
    st.toggleSelect('b3'); st.bulkArchive();
    expect(useStore.getState().tasks.find(t => t.id === 'b3')!.status).toBe('archived');
    st.toggleSelect('b1'); st.bulkDone();
    expect(useStore.getState().tasks.find(t => t.id === 'b1')!.status).toBe('done');
    expect(useStore.getState().tasks.find(t => t.id === 'b1')!.history.at(-1)!.kind).toBe('done');
  });

  it('signIn/signOut', () => {
    useStore.getState().signIn('Apple');
    expect(useStore.getState().user).toMatchObject({ provider: 'Apple', initials: 'SK', email: 'sam.kern@icloud.com' });
    useStore.getState().signOut();
    expect(useStore.getState().user).toBeNull();
    expect(useStore.getState().sel).toBeNull();
  });
});
