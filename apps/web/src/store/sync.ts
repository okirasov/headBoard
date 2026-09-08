import { type ApiError, type FileRef, type Task } from '@headboard/core';
import { api } from '../lib/api';
import { useStore, type Store } from './useStore';

/**
 * Keeps the local store and the API in sync while a token is present.
 * Initial load: server data wins when it has tasks; otherwise local tasks are pushed.
 * Afterwards every store change is diffed against the last synced snapshot and pushed.
 */
let started = false;
let snapshot = new Map<string, string>();
let projSnapshot = new Map<string, string>();
let settingsKey = '';
let retryTimer: ReturnType<typeof setTimeout> | undefined;
let queue: Promise<unknown> = Promise.resolve();
let settingsTimer: ReturnType<typeof setTimeout> | undefined;

const enqueue = (fn: () => Promise<unknown>) => { queue = queue.then(fn, fn).catch(() => undefined); return queue; };

function dataUrlToBlob(src: string): Blob | null {
  const m = /^data:([^;]+);base64,(.*)$/.exec(src);
  if (!m) return null;
  const bin = atob(m[2]);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: m[1] });
}

/** Upload locally read images so the server holds the bytes; returns the task with server file refs. */
async function uploadPendingFiles(t: Task): Promise<Task> {
  if (!api) return t;
  let changed = false;
  const files: FileRef[] = [];
  for (const f of t.files) {
    const blob = f.src ? dataUrlToBlob(f.src) : null;
    if (!blob) { files.push(f); continue; }
    try {
      const ref = await api.files.upload(blob, f.name, { taskId: t.id });
      files.push({ ...ref, src: ref.src ? absolute(ref.src) : f.src });
      changed = true;
    } catch { files.push(f); }
  }
  if (!changed) return t;
  const next = { ...t, files };
  useStore.getState().patchTask(t.id, { files });
  return next;
}

function absolute(src: string): string {
  return /^https?:/.test(src) || src.startsWith('data:') ? src : (api ? (import.meta.env.VITE_API_URL as string).replace(/\/$/, '') : '') + src;
}

function settingsOf(s: Store) {
  return { lang: s.lang, theme: s.theme, showDone: s.showDone, digestText: s.digestText };
}

/** On failure forget the snapshot entry so the item is retried shortly. */
function scheduleRetry() {
  clearTimeout(retryTimer);
  retryTimer = setTimeout(() => { void pushDiff(useStore.getState()); }, 3000);
}

async function pushDiff(s: Store) {
  const a = api;
  if (!a || !s.token) return;
  // projects first: tasks reference them
  const seenP = new Set<string>();
  for (const p of s.projects) {
    seenP.add(p.id);
    const json = JSON.stringify(p);
    if (projSnapshot.get(p.id) === json) continue;
    const isNew = !projSnapshot.has(p.id);
    projSnapshot.set(p.id, json);
    await enqueue(() => (isNew ? a.projects.create(p) : a.projects.patch(p.id, p)).catch(e => { if ((e as ApiError).code !== 'id_exists') { projSnapshot.delete(p.id); scheduleRetry(); } }));
  }
  for (const id of Array.from(projSnapshot.keys())) if (!seenP.has(id)) { projSnapshot.delete(id); await enqueue(() => a.projects.remove(id).catch(() => undefined)); }

  const seen = new Set<string>();
  for (const t of s.tasks) {
    seen.add(t.id);
    const json = JSON.stringify(t);
    if (snapshot.get(t.id) === json) continue;
    const isNew = !snapshot.has(t.id);
    snapshot.set(t.id, json);
    await enqueue(async () => {
      try {
        const ready = await uploadPendingFiles(t);
        snapshot.set(t.id, JSON.stringify(ready));
        if (isNew) await a.tasks.create(ready); else await a.tasks.patch(t.id, ready);
      } catch (e) {
        if ((e as ApiError).code === 'id_exists') { await a.tasks.patch(t.id, t).catch(() => undefined); return; }
        snapshot.delete(t.id);
        scheduleRetry();
      }
    });
  }
  for (const id of Array.from(snapshot.keys())) if (!seen.has(id)) { snapshot.delete(id); await enqueue(() => a.tasks.remove(id).catch(() => undefined)); }
  const sk = JSON.stringify(settingsOf(s));
  if (sk !== settingsKey) {
    settingsKey = sk;
    clearTimeout(settingsTimer);
    settingsTimer = setTimeout(() => enqueue(() => a.settings.put(settingsOf(useStore.getState()))), 500);
  }
}

let inflight: Promise<void> | null = null;

export function startSync(): Promise<void> {
  if (!inflight) inflight = doStartSync().finally(() => { inflight = null; });
  return inflight;
}

async function doStartSync(): Promise<void> {
  const a = api;
  if (!a) return;
  const st = useStore.getState();
  if (!st.token) return;
  try {
    const [tasks, projects, settings] = await Promise.all([a.tasks.list(true), a.projects.list(), a.settings.get()]);
    if (tasks.length) {
      snapshot = new Map(tasks.map(t => [t.id, JSON.stringify(t)]));
      projSnapshot = new Map(projects.map(({ files: _f, ...p }) => [p.id, JSON.stringify(p)]));
      const projFiles: Record<string, FileRef[]> = {};
      for (const p of projects) if (p.files?.length) projFiles[p.id] = p.files.map(f => ({ ...f, src: f.src ? absolute(f.src) : undefined }));
      useStore.setState({
        tasks: tasks.map(t => ({ ...t, files: t.files.map(f => ({ ...f, src: f.src ? absolute(f.src) : undefined })) })),
        projects: projects.map(({ files: _f, ...p }) => p), projFiles,
        lang: settings.lang, theme: settings.theme, showDone: settings.showDone, digestText: settings.digestText,
      });
      settingsKey = JSON.stringify(settingsOf(useStore.getState()));
    } else {
      snapshot = new Map();
      projSnapshot = new Map(projects.map(({ files: _f, ...p }) => [p.id, JSON.stringify(p)]));
      await pushDiff(useStore.getState());
    }
  } catch (e) {
    if ((e as { status?: number }).status === 401) { useStore.getState().signOut(); return; }
    st.toast(st.lang === 'ru' ? 'Синхронизация недоступна' : 'Sync unavailable');
  }
  if (!started) {
    started = true;
    useStore.subscribe(s => { void pushDiff(s); });
  }
}
