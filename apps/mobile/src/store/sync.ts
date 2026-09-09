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
      getState: () => useStore.getState(),
      setState: patch => useStore.setState(patch),
      subscribe: fn => useStore.subscribe(fn),
      // Local picks carry file:// (or content://) uris; React Native FormData uploads them from a descriptor.
      fileToPart: async f => (f.src && /^(file|content):/.test(f.src) ? { uri: f.src, name: f.name, type: mimeOf(f.name) } : null),
      onUnauthorized: () => useStore.getState().signOut(),
      onError: () => { const s = useStore.getState(); s.toast(s.lang === 'ru' ? 'Синхронизация недоступна' : 'Sync unavailable'); },
    });
  }
  return engine;
}

export async function startSync(): Promise<void> {
  await getEngine()?.start();
}
