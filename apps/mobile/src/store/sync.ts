import { createSyncEngine, type SyncEngine } from '@headboard/core';
import { api, API_URL } from '../lib/api';
import { useStore } from './useStore';

/** React Native adapter for the shared sync engine (see packages/core/src/sync.ts). */
let engine: SyncEngine | null = null;

function mimeOf(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return ({ png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', heic: 'image/heic', pdf: 'application/pdf' } as Record<string, string>)[ext] ?? 'application/octet-stream';
}

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
      // Local picks carry file:// (or content://) uris; React Native FormData uploads them from a descriptor.
      fileToPart: async f => (f.src && /^(file|content):/.test(f.src) ? { uri: f.src, name: f.name, type: mimeOf(f.name) } : null),
      onStatus: s => useStore.setState({ sync: s }),
      onUnauthorized: () => useStore.getState().signOut(),
      onError: () => { const s = useStore.getState(); s.toast(s.lang === 'ru' ? 'Синхронизация недоступна' : 'Sync unavailable'); },
    });
  }
  return engine;
}

export async function startSync(): Promise<void> {
  await getEngine()?.start();
}

/** Pull a newer scheduled digest and server-side task changes (calendar sync); called when the app returns to the foreground. */
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

export async function refreshTasks(): Promise<void> {
  await getEngine()?.refreshTasks();
}
