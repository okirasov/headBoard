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
      onUnauthorized: () => useStore.getState().signOut(),
      onError: () => { const s = useStore.getState(); s.toast(s.lang === 'ru' ? 'Синхронизация недоступна' : 'Sync unavailable'); },
    });
  }
  return engine;
}

export async function startSync(): Promise<void> {
  await getEngine()?.start();
}

/** Pull a newer scheduled digest; called on tab focus and every 15 minutes. */
export async function refreshSettings(): Promise<void> {
  await getEngine()?.refreshSettings();
}
