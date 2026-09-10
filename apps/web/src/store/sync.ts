import { createSyncEngine, dataUrlToBlob, type SyncEngine } from '@headboard/core';
import { api, API_URL } from '../lib/api';
import { useStore } from './useStore';

/** Web adapter for the shared sync engine (see packages/core/src/sync.ts). */
let engine: SyncEngine | null = null;

function getEngine(): SyncEngine | null {
  if (!api || !API_URL) return null;
  if (!engine) {
    engine = createSyncEngine({
      api,
      baseUrl: API_URL,
      timeZone: (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return undefined; } })(),
      getState: () => useStore.getState(),
      setState: patch => useStore.setState(patch),
      subscribe: fn => useStore.subscribe(fn),
      fileToPart: async f => (f.src && f.src.startsWith('data:') ? dataUrlToBlob(f.src) : null),
      onStatus: s => useStore.setState({ sync: s }),
      onUnauthorized: () => useStore.getState().signOut(),
      onError: () => { const s = useStore.getState(); s.toast(s.lang === 'ru' ? 'Синхронизация недоступна' : 'Sync unavailable'); },
    });
  }
  return engine;
}

let netHooked = false;
export async function startSync(): Promise<void> {
  const e = getEngine();
  if (!e) return;
  if (!netHooked && typeof window !== 'undefined') {
    netHooked = true;
    // Browser connectivity: retry immediately when the network is back, show offline as soon as it drops.
    window.addEventListener('online', () => { void e.flush(); void e.refreshTasks(); });
    window.addEventListener('offline', () => useStore.setState(st => ({ sync: { ...st.sync, state: 'offline' } })));
  }
  await e.start();
}

/** Pull a newer scheduled digest and server-side task changes (calendar sync); called on tab focus and every 15 minutes. */
export async function refreshSettings(): Promise<void> {
  const e = getEngine();
  if (!e) return;
  await Promise.all([e.refreshSettings(), e.refreshTasks()]);
}

/**
 * Server sweep for a bulk tag operation: push local edits first, then let the API rewrite whatever
 * this device did not have loaded, and adopt the result. No-op offline; the per-task diff covers it.
 */
export async function syncTagOp(op: { rename: [string, string] } | { remove: string }): Promise<void> {
  const e = getEngine();
  if (!e || !api || !useStore.getState().token) return;
  try {
    await e.flush();
    const r = 'rename' in op ? await api.tags.rename(op.rename[0], op.rename[1]) : await api.tags.remove(op.remove);
    if (r.changed > 0) await e.refreshTasks();
  } catch {
    // offline or server error: local change already applied and will be pushed by the engine
  }
}

/** Delete the account on the server, then drop everything locally and return to sign-in. */
export async function deleteAccount(): Promise<boolean> {
  const st = useStore.getState();
  if (!api || !st.token) { st.signOut(); return true; }
  try {
    getEngine()?.stop();
    await api.auth.deleteAccount();
  } catch {
    return false;
  }
  engine = null;
  st.signOut();
  return true;
}

export async function refreshTasks(): Promise<void> {
  await getEngine()?.refreshTasks();
}
