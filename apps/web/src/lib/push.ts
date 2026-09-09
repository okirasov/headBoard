import { api } from './api';

/** Web Push helpers: service worker registration, subscribe/unsubscribe against the API. */
export const pushSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!pushSupported) return null;
  try { return await navigator.serviceWorker.register('/sw.js'); } catch { return null; }
}

function urlBase64ToUint8Array(b64: string): Uint8Array {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}

export type PushState = 'unsupported' | 'unavailable' | 'denied' | 'off' | 'on';

/** Current state without prompting. */
export async function pushState(): Promise<PushState> {
  if (!pushSupported || !api) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  const reg = await navigator.serviceWorker.getRegistration('/sw.js');
  const sub = await reg?.pushManager.getSubscription();
  return sub ? 'on' : 'off';
}

/** Ask permission, subscribe the browser and register the subscription with the API. */
export async function enablePush(label = navigator.userAgent.split(') ')[0].split(' (')[0]): Promise<PushState> {
  if (!pushSupported || !api) return 'unsupported';
  const cfg = await api.push.config();
  if (!cfg.webPush || !cfg.vapidPublicKey) return 'unavailable';
  if ((await Notification.requestPermission()) !== 'granted') return 'denied';
  const reg = (await navigator.serviceWorker.getRegistration('/sw.js')) ?? (await registerServiceWorker());
  if (!reg) return 'unsupported';
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(cfg.vapidPublicKey) as BufferSource }));
  const j = sub.toJSON();
  await api.push.subscribeWeb({ endpoint: sub.endpoint, keys: { p256dh: j.keys?.p256dh ?? '', auth: j.keys?.auth ?? '' } }, label);
  return 'on';
}

export async function disablePush(): Promise<void> {
  if (!pushSupported) return;
  const reg = await navigator.serviceWorker.getRegistration('/sw.js');
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;
  await api?.push.unsubscribe(sub.endpoint).catch(() => undefined);
  await sub.unsubscribe();
}
