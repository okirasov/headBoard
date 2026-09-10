import { createSyncEngine, type SyncState } from './sync';
import { newTask } from './model';
import type { Api } from './api';

const now = Date.now();
function fakeStore(init: Partial<SyncState>) {
  let state: SyncState = { token: 'tok', tasks: [], projects: [], templates: [], projFiles: {}, lang: 'en', theme: 'light', showDone: true, digestText: null, digestAt: null, notifyStale: true, notifyDue: true, staleDays: 7, ...init };
  const subs = new Set<(s: SyncState) => void>();
  return {
    getState: () => state,
    setState: (p: Partial<SyncState>) => { state = { ...state, ...p }; subs.forEach(f => f(state)); },
    subscribe: (f: (s: SyncState) => void) => { subs.add(f); return () => subs.delete(f); },
  };
}
function fakeApi(server: { tasks: any[]; projects: any[]; settings?: any; templates?: any[] }) {
  const calls: string[] = [];
  const api = {
    tasks: {
      list: async () => server.tasks, create: async (t: any) => { calls.push('POST task ' + t.id); server.tasks.push(t); return t; },
      patch: async (id: string, up: any) => {
        calls.push('PATCH task ' + id + ' ' + Object.keys(up).join(','));
        const i = server.tasks.findIndex(t => t.id === id);
        if (i < 0) return up;
        const cur = server.tasks[i];
        const { comments, history, ...rest } = up;
        const merged = { ...cur, ...rest };
        if (comments) { const byId = new Map(cur.comments.map((c: any) => [c.id, c])); for (const c of comments) byId.set(c.id, c); merged.comments = [...byId.values()]; }
        if (history) { const byId = new Map((cur.history ?? []).map((h: any) => [h.id, h])); for (const h of history) byId.set(h.id, h); merged.history = [...byId.values()].sort((a: any, b: any) => a.at - b.at); }
        server.tasks[i] = merged;
        return merged;
      },
      remove: async (id: string) => { calls.push('DELETE task ' + id); },
      removeComment: async (id: string, cid: string) => { calls.push('DELETE comment ' + cid); const t = server.tasks.find(x => x.id === id); if (t) t.comments = t.comments.filter((c: any) => c.id !== cid); },
    },
    projects: {
      list: async () => server.projects, create: async (p: any) => { calls.push('POST project ' + p.id); return p; },
      patch: async (id: string) => { calls.push('PATCH project ' + id); return {}; }, remove: async () => undefined,
    },
    templates: { list: async () => server.templates ?? [], create: async (t: any) => { calls.push('POST template ' + t.id); return t; }, patch: async (id: string) => { calls.push('PATCH template ' + id); return {}; }, remove: async (id: string) => { calls.push('DELETE template ' + id); } },
    settings: { get: async () => server.settings ?? ({ lang: 'ru', theme: 'dark', showDone: false, digestText: 'd', digestAt: 100 }), put: async (s: any) => { calls.push('PUT settings ' + s.lang + (s.timeZone ? ' ' + s.timeZone : '')); return server.settings ? { ...server.settings, ...s, digestText: server.settings.digestText, digestAt: server.settings.digestAt } : s; } },
    files: { upload: async () => ({ id: 'srv1', name: 'a.png', kind: 'img', src: '/files/srv1/content' }) },
  } as unknown as Api;
  return { api, calls };
}
const tick = () => new Promise(r => setTimeout(r, 10));

describe('sync engine', () => {
  it('server wins on initial load when it has tasks', async () => {
    const st = fakeStore({ tasks: [newTask({ id: 'local', title: 'L' }, now)] });
    const { api } = fakeApi({ tasks: [newTask({ id: 'srv', title: 'S' }, now)], projects: [{ id: 'p', name: 'P', color: '#000', files: [{ id: 'f', name: 'x.png', kind: 'img', src: '/files/f/content' }] }] });
    const eng = createSyncEngine({ api, ...st, fileToPart: async () => null, onUnauthorized: () => undefined, onError: () => undefined, baseUrl: 'http://api/' });
    await eng.start();
    const s = st.getState();
    expect(s.tasks.map(t => t.id)).toEqual(['srv']);
    expect(s.projects).toEqual([{ id: 'p', name: 'P', color: '#000' }]);
    expect(s.projFiles.p[0].src).toBe('http://api/files/f/content');
    expect(s.lang).toBe('ru');
    expect(s.theme).toBe('dark');
    expect(s.digestAt).toBe(100);
  });

  it('sends the time zone with settings and adopts a newer scheduled digest on refresh', async () => {
    const st = fakeStore({ digestText: 'old', digestAt: 100 });
    const server = { tasks: [], projects: [], settings: { lang: 'en', theme: 'light', showDone: true, digestText: 'old', digestAt: 100 } as any };
    const { api, calls } = fakeApi(server);
    const eng = createSyncEngine({ api, ...st, fileToPart: async () => null, onUnauthorized: () => undefined, onError: () => undefined, baseUrl: '', timeZone: 'Europe/Belgrade' });
    await eng.start();
    st.setState({ showDone: false });
    await new Promise(r => setTimeout(r, 600));
    expect(calls).toContain('PUT settings en Europe/Belgrade');
    // server already holds a newer scheduled digest: the PUT response brings it back
    server.settings = { ...server.settings, digestText: 'scheduled', digestAt: 150 };
    st.setState({ lang: 'ru' });
    await new Promise(r => setTimeout(r, 600));
    expect(st.getState().digestText).toBe('scheduled');
    expect(st.getState().digestAt).toBe(150);
    server.settings = { ...server.settings, digestText: 'fresh morning digest', digestAt: 200 };
    await eng.refreshSettings();
    expect(st.getState().digestText).toBe('fresh morning digest');
    expect(st.getState().digestAt).toBe(200);
    eng.stop();
  });

  it('pushes local projects then tasks when the server is empty, and diffs later changes', async () => {
    const st = fakeStore({ tasks: [newTask({ id: 'a', title: 'A', proj: 'p' }, now)], projects: [{ id: 'p', name: 'P', color: '#000' }] });
    const { api, calls } = fakeApi({ tasks: [], projects: [] });
    const eng = createSyncEngine({ api, ...st, fileToPart: async () => null, onUnauthorized: () => undefined, onError: () => undefined, baseUrl: 'http://api' });
    await eng.start();
    await tick();
    expect(calls.slice(0, 2)).toEqual(['POST project p', 'POST task a']);
    st.setState({ tasks: st.getState().tasks.map(t => ({ ...t, status: 'done' as const })) });
    await tick();
    expect(calls.some(c => c.startsWith('PATCH task a '))).toBe(true);
    st.setState({ tasks: [] });
    await tick();
    expect(calls).toContain('DELETE task a');
    st.setState({ lang: 'ru' });
    await new Promise(r => setTimeout(r, 600));
    expect(calls).toContain('PUT settings ru');
    eng.stop();
  });

  it('templates are pulled on start and diffed like projects', async () => {
    const st = fakeStore({});
    const server = { tasks: [newTask({ id: 's', title: 'S' }, now)], projects: [], templates: [{ id: 'tp1', name: 'Retro', title: 'Retro', proj: null, pr: 1 as const, tags: [] as string[], note: '', dueInDays: 3, remindDays: null, usedCount: 0 }] };
    const { api, calls } = fakeApi(server);
    const eng = createSyncEngine({ api, ...st, fileToPart: async () => null, onUnauthorized: () => undefined, onError: () => undefined, baseUrl: '' });
    await eng.start();
    expect(st.getState().templates.map(t => t.id)).toEqual(['tp1']);
    st.setState({ templates: [{ ...server.templates[0], name: 'Retro v2' }, { id: 'tp2', name: 'New', title: 'New', proj: null, pr: 1 as const, tags: [], note: '', dueInDays: null, remindDays: null, usedCount: 0 }] });
    await tick();
    expect(calls).toContain('PATCH template tp1');
    expect(calls).toContain('POST template tp2');
    st.setState({ templates: [] });
    await tick();
    expect(calls).toContain('DELETE template tp1');
    eng.stop();
  });

  it('uploads pending files and swaps in server refs', async () => {
    const st = fakeStore({ tasks: [newTask({ id: 'a', title: 'A', files: [{ id: 'loc', name: 'a.png', kind: 'img', src: 'data:image/png;base64,AAAA' }] }, now)] });
    const { api } = fakeApi({ tasks: [], projects: [] });
    const eng = createSyncEngine({ api, ...st, fileToPart: async f => (f.src?.startsWith('data:') ? new Blob(['x']) : null), onUnauthorized: () => undefined, onError: () => undefined, baseUrl: 'http://api' });
    await eng.start();
    await tick();
    expect(st.getState().tasks[0].files[0]).toEqual({ id: 'srv1', name: 'a.png', kind: 'img', src: 'http://api/files/srv1/content' });
    eng.stop();
  });

  it('refreshTasks adopts newer or unknown server tasks and keeps local-newer ones', async () => {
    const mine = newTask({ id: 'a', title: 'Local newer', touched: 500 }, now);
    const stale = newTask({ id: 'b', title: 'Old local', touched: 100 }, now);
    const st = fakeStore({ tasks: [mine, stale] });
    const server = { tasks: [] as any[], projects: [] };
    const { api } = fakeApi(server);
    const eng = createSyncEngine({ api, ...st, fileToPart: async () => null, onUnauthorized: () => undefined, onError: () => undefined, baseUrl: '' });
    await eng.start();
    server.tasks = [
      { ...mine, title: 'Server older', touched: 400 },
      { ...stale, title: 'Moved in calendar', touched: 900, due: 123 },
      newTask({ id: 'g1', title: 'Created in Google Calendar', due: 456 }, now),
    ];
    await eng.refreshTasks();
    const tasks = st.getState().tasks;
    expect(tasks.find(t => t.id === 'a')!.title).toBe('Local newer');
    expect(tasks.find(t => t.id === 'b')!.title).toBe('Moved in calendar');
    expect(tasks.find(t => t.id === 'g1')).toBeTruthy();
    eng.stop();
  });

  it('refreshTasks three-way merges edits made on two devices and pushes the result back', async () => {
    const t0 = newTask({ id: 'm1', title: 'Shared', touched: 100, comments: [{ id: 'c1', text: 'old', at: 1 }] }, now);
    const st = fakeStore({ tasks: [] });
    const server = { tasks: [t0] as any[], projects: [] };
    const { api, calls } = fakeApi(server);
    const eng = createSyncEngine({ api, ...st, fileToPart: async () => null, onUnauthorized: () => undefined, onError: () => undefined, baseUrl: '' });
    await eng.start(); // snapshot = t0
    // this device edits the note and adds a comment; another device (via the server) moved the date and dropped c1
    st.setState({ tasks: [{ ...t0, note: 'mine', comments: [...t0.comments, { id: 'c2', text: 'new here', at: 2 }], touched: 200 }] });
    await tick();
    expect(calls.at(-1)).toBe('PATCH task m1 touched,note,comments'); // partial: only what changed here
    expect(server.tasks[0].note).toBe('mine');
    const patches = calls.filter(c => c.startsWith('PATCH task')).length;
    // device B (through the server): moves the date and deletes c1 — it never saw c2, and sends only its own delta
    server.tasks[0] = { ...server.tasks[0], due: 555, touched: 300, comments: server.tasks[0].comments.filter((c: any) => c.id !== 'c1') };
    await eng.refreshTasks();
    await tick();
    const m = st.getState().tasks[0];
    expect(m.note).toBe('mine');
    expect(m.due).toBe(555);
    expect(m.comments.map(c => c.id)).toEqual(['c2']);
    expect(m.touched).toBe(300);
    expect(calls.filter(c => c.startsWith('PATCH task')).length).toBe(patches); // merge equals the server copy → nothing to push back
    expect(calls.some(c => c.startsWith('DELETE comment'))).toBe(false); // c1 was removed elsewhere, not re-deleted here
    // a second refresh with the same server copy is a no-op
    const before = JSON.stringify(st.getState().tasks);
    await eng.refreshTasks();
    expect(JSON.stringify(st.getState().tasks)).toBe(before);
    eng.stop();
  });

  it('signs out on 401', async () => {
    const st = fakeStore({});
    const out: string[] = [];
    const api = { tasks: { list: async () => { throw Object.assign(new Error('x'), { status: 401, code: 'http_401' }); } }, projects: { list: async () => [] }, settings: { get: async () => ({}) } } as unknown as Api;
    await createSyncEngine({ api, ...st, fileToPart: async () => null, onUnauthorized: () => out.push('unauth'), onError: m => out.push(m), baseUrl: '' }).start();
    expect(out).toEqual(['unauth']);
  });
});
