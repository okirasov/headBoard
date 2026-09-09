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
    expect(useStore.getState().snack).toBe('Moved to Done');
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
