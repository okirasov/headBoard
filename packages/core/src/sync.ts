import type { Api, ApiError } from './api';
import type { FileRef, Lang, Project, Task, Theme } from './model';

/** The slice of application state the sync engine reads and writes. */
export interface SyncState {
  token: string | null;
  tasks: Task[];
  projects: Project[];
  projFiles: Record<string, FileRef[]>;
  lang: Lang;
  theme: Theme;
  showDone: boolean;
  digestText: string | null;
}

export interface SyncAdapter {
  api: Api;
  getState: () => SyncState;
  /** Merge a partial state (server data on initial load, uploaded file refs). */
  setState: (patch: Partial<SyncState>) => void;
  /** Subscribe to every state change; returns unsubscribe. */
  subscribe: (fn: (s: SyncState) => void) => () => void;
  /** Turn a locally held file into an uploadable part, or null when it already lives on the server. */
  fileToPart: (f: FileRef) => Promise<Blob | { uri: string; name: string; type: string } | null>;
  onUnauthorized: () => void;
  onError: (message: string) => void;
  /** Absolute base URL for relative `src` values returned by the API. */
  baseUrl: string;
}

export interface SyncEngine {
  /** Pull server state (server wins when it has tasks; otherwise push local) and start watching. */
  start: () => Promise<void>;
  /** Push any local changes now (normally driven by `subscribe`). */
  flush: () => Promise<void>;
  stop: () => void;
}

function settingsOf(s: SyncState) {
  return { lang: s.lang, theme: s.theme, showDone: s.showDone, digestText: s.digestText };
}

/**
 * Offline-first sync between a local store and the Headboard API.
 * Tracks the last synced JSON per task/project; on change: POST new, PATCH changed, DELETE removed.
 * Failed pushes are forgotten and retried after `retryMs`.
 */
export function createSyncEngine(a: SyncAdapter, retryMs = 3000): SyncEngine {
  const { api } = a;
  let taskSnap = new Map<string, string>();
  let projSnap = new Map<string, string>();
  let settingsKey = '';
  let queue: Promise<unknown> = Promise.resolve();
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  let settingsTimer: ReturnType<typeof setTimeout> | undefined;
  let unsub: (() => void) | null = null;
  let inflight: Promise<void> | null = null;

  const enqueue = (fn: () => Promise<unknown>) => { queue = queue.then(fn, fn).catch(() => undefined); return queue; };
  const absolute = (src: string) => (/^(https?:|data:|file:|content:)/.test(src) ? src : a.baseUrl.replace(/\/$/, '') + src);
  const code = (e: unknown) => (e as ApiError | undefined)?.code;
  const scheduleRetry = () => { clearTimeout(retryTimer); retryTimer = setTimeout(() => { void flush(); }, retryMs); };

  /** Upload files the server does not have yet; returns the task with server refs and updates the store. */
  async function uploadPendingFiles(t: Task): Promise<Task> {
    let changed = false;
    const files: FileRef[] = [];
    for (const f of t.files) {
      const part = await a.fileToPart(f).catch(() => null);
      if (!part) { files.push(f); continue; }
      try {
        const ref = await api.files.upload(part, f.name, { taskId: t.id });
        files.push({ ...ref, src: ref.src ? absolute(ref.src) : f.src });
        changed = true;
      } catch { files.push(f); }
    }
    if (!changed) return t;
    const st = a.getState();
    a.setState({ tasks: st.tasks.map(x => (x.id === t.id ? { ...x, files } : x)) });
    return { ...t, files };
  }

  async function flush(): Promise<void> {
    const s = a.getState();
    if (!s.token) return;

    const seenP = new Set<string>();
    for (const p of s.projects) {
      seenP.add(p.id);
      const json = JSON.stringify(p);
      if (projSnap.get(p.id) === json) continue;
      const isNew = !projSnap.has(p.id);
      projSnap.set(p.id, json);
      await enqueue(() => (isNew ? api.projects.create(p) : api.projects.patch(p.id, p)).catch(e => {
        if (code(e) === 'id_exists') return;
        projSnap.delete(p.id); scheduleRetry();
      }));
    }
    for (const id of Array.from(projSnap.keys())) if (!seenP.has(id)) { projSnap.delete(id); await enqueue(() => api.projects.remove(id).catch(() => undefined)); }

    const seen = new Set<string>();
    for (const t of s.tasks) {
      seen.add(t.id);
      const json = JSON.stringify(t);
      if (taskSnap.get(t.id) === json) continue;
      const isNew = !taskSnap.has(t.id);
      taskSnap.set(t.id, json);
      await enqueue(async () => {
        try {
          const ready = await uploadPendingFiles(t);
          taskSnap.set(t.id, JSON.stringify(ready));
          if (isNew) await api.tasks.create(ready); else await api.tasks.patch(t.id, ready);
        } catch (e) {
          if (code(e) === 'id_exists') { await api.tasks.patch(t.id, t).catch(() => undefined); return; }
          taskSnap.delete(t.id); scheduleRetry();
        }
      });
    }
    for (const id of Array.from(taskSnap.keys())) if (!seen.has(id)) { taskSnap.delete(id); await enqueue(() => api.tasks.remove(id).catch(() => undefined)); }

    const sk = JSON.stringify(settingsOf(s));
    if (sk !== settingsKey) {
      settingsKey = sk;
      clearTimeout(settingsTimer);
      settingsTimer = setTimeout(() => enqueue(() => api.settings.put(settingsOf(a.getState())).catch(() => { settingsKey = ''; scheduleRetry(); })), 500);
    }
  }

  async function doStart(): Promise<void> {
    const st = a.getState();
    if (!st.token) return;
    try {
      const [tasks, projects, settings] = await Promise.all([api.tasks.list(true), api.projects.list(), api.settings.get()]);
      const plain = projects.map(({ files: _f, ...p }) => p);
      projSnap = new Map(plain.map(p => [p.id, JSON.stringify(p)]));
      if (tasks.length) {
        const fixed = tasks.map(t => ({ ...t, files: t.files.map(f => ({ ...f, src: f.src ? absolute(f.src) : undefined })) }));
        taskSnap = new Map(fixed.map(t => [t.id, JSON.stringify(t)]));
        const projFiles: Record<string, FileRef[]> = {};
        for (const p of projects) if (p.files?.length) projFiles[p.id] = p.files.map(f => ({ ...f, src: f.src ? absolute(f.src) : undefined }));
        a.setState({ tasks: fixed, projects: plain, projFiles, lang: settings.lang, theme: settings.theme, showDone: settings.showDone, digestText: settings.digestText });
        settingsKey = JSON.stringify(settingsOf(a.getState()));
      } else {
        taskSnap = new Map();
        await flush();
      }
    } catch (e) {
      if ((e as ApiError | undefined)?.status === 401) { a.onUnauthorized(); return; }
      a.onError('sync_unavailable');
    }
    if (!unsub) unsub = a.subscribe(() => { void flush(); });
  }

  return {
    start: () => { if (!inflight) inflight = doStart().finally(() => { inflight = null; }); return inflight; },
    flush,
    stop: () => { unsub?.(); unsub = null; clearTimeout(retryTimer); clearTimeout(settingsTimer); },
  };
}

/** Decode a `data:` URL into a Blob (web file attachments). */
export function dataUrlToBlob(src: string): Blob | null {
  const m = /^data:([^;]+);base64,(.*)$/.exec(src);
  if (!m) return null;
  const bin = atob(m[2]);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: m[1] });
}
