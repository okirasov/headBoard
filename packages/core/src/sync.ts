import { mergeTask, taskDelta } from './merge';
import type { Api, ApiError } from './api';
import type { FileRef, Lang, Project, Task, Template, Theme } from './model';

/** The slice of application state the sync engine reads and writes. */
export interface SyncState {
  token: string | null;
  tasks: Task[];
  projects: Project[];
  templates: Template[];
  projFiles: Record<string, FileRef[]>;
  lang: Lang;
  theme: Theme;
  showDone: boolean;
  digestText: string | null;
  /** Server-owned timestamp of the last digest change. */
  digestAt: number | null;
  /** Daily push about forgotten tasks. */
  notifyStale: boolean;
  notifyDue: boolean;
  staleDays: number;
}

/** What the UI shows about sync: local-only (no account), in flight, all pushed, or waiting for the network. */
export interface SyncStatus {
  state: 'local' | 'syncing' | 'synced' | 'offline';
  /** Items that failed to push and will be retried. */
  pending: number;
  lastSyncAt: number | null;
}

export interface SyncAdapter {
  api: Api;
  /** Called whenever the sync status changes. */
  onStatus?: (s: SyncStatus) => void;
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
  /** IANA time zone reported to the server so the 08:00 digest lands in the user's morning. */
  timeZone?: string;
}

export interface SyncEngine {
  /** Pull server state (server wins when it has tasks; otherwise push local) and start watching. */
  start: () => Promise<void>;
  /** Push any local changes now (normally driven by `subscribe`). */
  flush: () => Promise<void>;
  status: () => SyncStatus;
  /** Re-read settings from the server and adopt a newer digest (call on focus / app foreground). */
  refreshSettings: () => Promise<void>;
  /** Pull tasks changed on the server (calendar sync, other devices) and merge the newer ones into the store. */
  refreshTasks: () => Promise<void>;
  stop: () => void;
}

function settingsOf(s: SyncState, timeZone?: string) {
  return { lang: s.lang, theme: s.theme, showDone: s.showDone, digestText: s.digestText, timeZone: timeZone ?? null, notifyStale: s.notifyStale, notifyDue: s.notifyDue, staleDays: s.staleDays };
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
  let tplSnap = new Map<string, string>();
  let settingsKey = '';
  let queue: Promise<unknown> = Promise.resolve();
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  let settingsTimer: ReturnType<typeof setTimeout> | undefined;
  let unsub: (() => void) | null = null;
  let inflight: Promise<void> | null = null;

  let status: SyncStatus = { state: 'local', pending: 0, lastSyncAt: null };
  let active = 0;
  let failed = 0;
  const report = (patch: Partial<SyncStatus>) => { const next = { ...status, ...patch }; if (JSON.stringify(next) !== JSON.stringify(status)) { status = next; a.onStatus?.(status); } };
  const settle = () => report(failed > 0 ? { state: 'offline', pending: failed } : { state: 'synced', pending: 0, lastSyncAt: Date.now() });
  const enqueue = (fn: () => Promise<unknown>) => {
    active++;
    report({ state: 'syncing' });
    queue = queue.then(fn, fn).catch(() => undefined).finally(() => { active--; if (active === 0) settle(); });
    return queue;
  };
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
    if (!s.token) { report({ state: 'local', pending: 0 }); return; }
    failed = 0;

    const seenP = new Set<string>();
    for (const p of s.projects) {
      seenP.add(p.id);
      const json = JSON.stringify(p);
      if (projSnap.get(p.id) === json) continue;
      const isNew = !projSnap.has(p.id);
      projSnap.set(p.id, json);
      await enqueue(() => (isNew ? api.projects.create(p) : api.projects.patch(p.id, p)).catch(e => {
        if (code(e) === 'id_exists') return;
        projSnap.delete(p.id); failed++; scheduleRetry();
      }));
    }
    for (const id of Array.from(projSnap.keys())) if (!seenP.has(id)) { projSnap.delete(id); await enqueue(() => api.projects.remove(id).catch(() => undefined)); }

    const seenT = new Set<string>();
    for (const t of s.templates) {
      seenT.add(t.id);
      const json = JSON.stringify(t);
      if (tplSnap.get(t.id) === json) continue;
      const isNew = !tplSnap.has(t.id);
      tplSnap.set(t.id, json);
      await enqueue(() => (isNew ? api.templates.create(t) : api.templates.patch(t.id, t)).catch(e => {
        if (code(e) === 'id_exists') return;
        tplSnap.delete(t.id); failed++; scheduleRetry();
      }));
    }
    for (const id of Array.from(tplSnap.keys())) if (!seenT.has(id)) { tplSnap.delete(id); await enqueue(() => api.templates.remove(id).catch(() => undefined)); }

    const seen = new Set<string>();
    for (const t of s.tasks) {
      seen.add(t.id);
      const json = JSON.stringify(t);
      if (taskSnap.get(t.id) === json) continue;
      const prev = taskSnap.get(t.id);
      const isNew = prev === undefined;
      taskSnap.set(t.id, json);
      await enqueue(async () => {
        try {
          const ready = await uploadPendingFiles(t);
          taskSnap.set(t.id, JSON.stringify(ready));
          if (isNew) { await api.tasks.create(ready); return; }
          // Send only what changed on this device (see mergeTask/taskDelta): other devices' edits to other fields survive.
          const { patch, removedComments } = taskDelta(JSON.parse(prev) as Task, ready);
          for (const cid of removedComments) await api.tasks.removeComment(t.id, cid).catch(() => undefined);
          if (Object.keys(patch).length) await api.tasks.patch(t.id, patch);
        } catch (e) {
          if (code(e) === 'id_exists') { await api.tasks.patch(t.id, t).catch(() => undefined); return; }
          taskSnap.delete(t.id); failed++; scheduleRetry();
        }
      });
    }
    for (const id of Array.from(taskSnap.keys())) if (!seen.has(id)) { taskSnap.delete(id); await enqueue(() => api.tasks.remove(id).catch(() => undefined)); }

    const sk = JSON.stringify(settingsOf(s, a.timeZone));
    if (sk !== settingsKey) {
      settingsKey = sk;
      clearTimeout(settingsTimer);
      settingsTimer = setTimeout(() => enqueue(async () => {
        try {
          const saved = await api.settings.put(settingsOf(a.getState(), a.timeZone));
          // The server owns the digest: adopt its text and timestamp when they differ (e.g. the 08:00 scheduler ran).
          const cur = a.getState();
          if (saved.digestAt !== undefined && saved.digestAt !== cur.digestAt) {
            a.setState({ digestAt: saved.digestAt ?? null, digestText: saved.digestText ?? cur.digestText });
            settingsKey = JSON.stringify(settingsOf(a.getState(), a.timeZone));
          }
        } catch { settingsKey = ''; failed++; scheduleRetry(); }
      }), 500);
    }
  }

  async function doStart(): Promise<void> {
    const st = a.getState();
    if (!st.token) return;
    try {
      const [tasks, projects, settings, templates] = await Promise.all([api.tasks.list(true), api.projects.list(), api.settings.get(), Promise.resolve().then(() => api.templates.list()).catch(() => [] as Template[])]);
      const plain = projects.map(({ files: _f, ...p }) => p);
      projSnap = new Map(plain.map(p => [p.id, JSON.stringify(p)]));
      if (templates.length) tplSnap = new Map(templates.map(t => [t.id, JSON.stringify(t)]));
      if (tasks.length) {
        const fixed = tasks.map(t => ({ ...t, files: t.files.map(f => ({ ...f, src: f.src ? absolute(f.src) : undefined })) }));
        taskSnap = new Map(fixed.map(t => [t.id, JSON.stringify(t)]));
        const projFiles: Record<string, FileRef[]> = {};
        for (const p of projects) if (p.files?.length) projFiles[p.id] = p.files.map(f => ({ ...f, src: f.src ? absolute(f.src) : undefined }));
        // Server copy first; anything that exists only on this device (work done before signing in) is kept
        // and pushed by the flush that follows. Same-id tasks go to the more recently touched version.
        const localTasks = st.tasks;
        const mergedTasks = fixed.map(t => { const mine = localTasks.find(x => x.id === t.id); return mine ? mergeTask(null, mine, t) : t; });
        for (const mine of localTasks) if (!fixed.some(t => t.id === mine.id)) mergedTasks.push(mine);
        const mergedProjects = [...plain, ...st.projects.filter(p => !plain.some(x => x.id === p.id))];
        const mergedTemplates = templates.length ? [...templates, ...st.templates.filter(t => !templates.some(x => x.id === t.id))] : st.templates;
        for (const p of mergedProjects) if (!projSnap.has(p.id)) { /* local-only: no snapshot → POSTed by flush */ }
        a.setState({ tasks: mergedTasks, projects: mergedProjects, projFiles, templates: mergedTemplates, lang: settings.lang, theme: settings.theme, showDone: settings.showDone, digestText: settings.digestText, digestAt: settings.digestAt ?? null, notifyStale: settings.notifyStale ?? true, notifyDue: settings.notifyDue ?? true, staleDays: settings.staleDays ?? 7 });
        settingsKey = JSON.stringify(settingsOf(a.getState(), a.timeZone));
        if (localTasks.some(t => !fixed.some(x => x.id === t.id)) || st.projects.some(p => !plain.some(x => x.id === p.id))) await flush();
      } else {
        taskSnap = new Map();
        await flush();
      }
      report({ state: 'synced', pending: 0, lastSyncAt: Date.now() });
    } catch (e) {
      if ((e as ApiError | undefined)?.status === 401) { a.onUnauthorized(); report({ state: 'local', pending: 0 }); return; }
      a.onError('sync_unavailable');
      report({ state: 'offline' });
      scheduleRetry();
    }
    // Flush only when synced data changed. UI-only updates (including our own status reports) must not
    // re-enter flush, otherwise a failing push would loop through report → setState → flush without yielding.
    let seen = { tasks: a.getState().tasks, projects: a.getState().projects, templates: a.getState().templates, settings: JSON.stringify(settingsOf(a.getState(), a.timeZone)) };
    if (!unsub) unsub = a.subscribe(s => {
      const settings = JSON.stringify(settingsOf(s, a.timeZone));
      if (s.tasks === seen.tasks && s.projects === seen.projects && s.templates === seen.templates && settings === seen.settings) return;
      seen = { tasks: s.tasks, projects: s.projects, templates: s.templates, settings };
      void flush();
    });
  }

  async function refreshSettings(): Promise<void> {
    const s = a.getState();
    if (!s.token) return;
    try {
      const srv = await api.settings.get();
      const at = srv.digestAt ?? null;
      if (at !== null && at !== s.digestAt) {
        a.setState({ digestText: srv.digestText, digestAt: at });
        settingsKey = JSON.stringify(settingsOf(a.getState(), a.timeZone));
      }
    } catch { /* offline: keep local */ }
  }

  /**
   * Pull server tasks and three-way merge them with local state (base = last synced snapshot):
   * unknown tasks are adopted, one-sided edits from either side are kept, conflicts go to the newer
   * `touched`. When the merge differs from the server copy the snapshot stays at the server version, so
   * the next flush PATCHes the merged result back. Local-only tasks are left for flush.
   */
  async function refreshTasks(): Promise<void> {
    const s = a.getState();
    if (!s.token) return;
    try {
      const srv = await api.tasks.list(true);
      const local = new Map(s.tasks.map(t => [t.id, t]));
      const merged = [...s.tasks];
      let changed = false;
      for (const raw of srv) {
        const t = { ...raw, files: raw.files.map(f => ({ ...f, src: f.src ? absolute(f.src) : undefined })) };
        const mine = local.get(t.id);
        const json = JSON.stringify(t);
        if (!mine) { merged.unshift(t); taskSnap.set(t.id, json); changed = true; continue; }
        if (JSON.stringify(mine) === json) { taskSnap.set(t.id, json); continue; }
        const snap = taskSnap.get(t.id);
        const base = snap ? (JSON.parse(snap) as Task) : null;
        if (base && t.touched < base.touched) continue; // stale read (replica lag / push still in flight): keep local
        const m = mergeTask(base, mine, t);
        taskSnap.set(t.id, json);
        if (m === mine) { if (base) continue; }
        if (JSON.stringify(m) !== JSON.stringify(mine)) { merged[merged.findIndex(x => x.id === t.id)] = m; changed = true; }
      }
      if (changed) a.setState({ tasks: merged });
      if (active === 0) report({ state: failed > 0 ? 'offline' : 'synced', lastSyncAt: Date.now() });
    } catch { report({ state: 'offline' }); }
  }

  return {
    start: () => { if (!inflight) inflight = doStart().finally(() => { inflight = null; }); return inflight; },
    flush,
    refreshSettings,
    refreshTasks,
    status: () => status,
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
