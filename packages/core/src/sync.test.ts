import { createSyncEngine, type SyncState } from './sync';
import { newTask } from './model';
import type { Api } from './api';

const now = Date.now();
function fakeStore(init: Partial<SyncState>) {
  let state: SyncState = { token: 'tok', tasks: [], projects: [], projFiles: {}, lang: 'en', theme: 'light', showDone: true, digestText: null, ...init };
  const subs = new Set<(s: SyncState) => void>();
  return {
    getState: () => state,
    setState: (p: Partial<SyncState>) => { state = { ...state, ...p }; subs.forEach(f => f(state)); },
    subscribe: (f: (s: SyncState) => void) => { subs.add(f); return () => subs.delete(f); },
  };
}
function fakeApi(server: { tasks: any[]; projects: any[] }) {
  const calls: string[] = [];
  const api = {
    tasks: {
      list: async () => server.tasks, create: async (t: any) => { calls.push('POST task ' + t.id); server.tasks.push(t); return t; },
      patch: async (id: string, up: any) => { calls.push('PATCH task ' + id); return up; }, remove: async (id: string) => { calls.push('DELETE task ' + id); },
    },
    projects: {
      list: async () => server.projects, create: async (p: any) => { calls.push('POST project ' + p.id); return p; },
      patch: async (id: string) => { calls.push('PATCH project ' + id); return {}; }, remove: async () => undefined,
    },
    settings: { get: async () => ({ lang: 'ru', theme: 'dark', showDone: false, digestText: 'd' }), put: async (s: any) => { calls.push('PUT settings ' + s.lang); return s; } },
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
    expect(calls).toContain('PATCH task a');
    st.setState({ tasks: [] });
    await tick();
    expect(calls).toContain('DELETE task a');
    st.setState({ lang: 'ru' });
    await new Promise(r => setTimeout(r, 600));
    expect(calls).toContain('PUT settings ru');
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

  it('signs out on 401', async () => {
    const st = fakeStore({});
    const out: string[] = [];
    const api = { tasks: { list: async () => { throw Object.assign(new Error('x'), { status: 401, code: 'http_401' }); } }, projects: { list: async () => [] }, settings: { get: async () => ({}) } } as unknown as Api;
    await createSyncEngine({ api, ...st, fileToPart: async () => null, onUnauthorized: () => out.push('unauth'), onError: m => out.push(m), baseUrl: '' }).start();
    expect(out).toEqual(['unauth']);
  });
});
