import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { api } from './api';
import { useStore } from '../store/useStore';

/** Expo push: permission, token registration with the API, and tap handling (opens Review). */
export type PushState = 'unsupported' | 'denied' | 'off' | 'on';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

function projectId(): string | undefined {
  const id = process.env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim() || (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId;
  return id || undefined;
}

export async function enablePush(): Promise<PushState> {
  if (!api || !Device.isDevice) return 'unsupported';
  const perm = await Notifications.getPermissionsAsync();
  const status = perm.granted ? 'granted' : (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return 'denied';
  if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('default', { name: 'Headboard', importance: Notifications.AndroidImportance.DEFAULT });
  const pid = projectId();
  if (!pid) return 'unsupported';
  const token = (await Notifications.getExpoPushTokenAsync({ projectId: pid })).data;
  await api.push.subscribeExpo(token, `${Device.modelName ?? Platform.OS}`);
  useStore.getState().set({ notifyStale: true });
  return 'on';
}

export async function disablePush(): Promise<void> {
  const pid = projectId();
  if (api && pid && Device.isDevice) {
    try { const token = (await Notifications.getExpoPushTokenAsync({ projectId: pid })).data; await api.push.unsubscribe(token); } catch { /* not registered */ }
  }
  useStore.getState().set({ notifyStale: false });
}

/** Whether this device is registered (best effort: permission granted and the API lists a token). */
export async function pushState(): Promise<PushState> {
  if (!api || !Device.isDevice) return 'unsupported';
  const perm = await Notifications.getPermissionsAsync();
  if (perm.status === 'denied' && !perm.canAskAgain) return 'denied';
  if (!perm.granted) return 'off';
  try { const list = await api.push.list(); return list.some(s => s.kind === 'expo') ? 'on' : 'off'; } catch { return 'off'; }
}

/** Route notification taps to the view named in `data.url` (e.g. /?view=review). */
export function listenForNotificationTaps(): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener(res => {
    const url = String((res.notification.request.content.data as { url?: string } | undefined)?.url ?? '');
    const v = /view=(\w+)/.exec(url)?.[1];
    if (v === 'board' || v === 'review' || v === 'digest' || v === 'calendar' || v === 'archive') useStore.getState().set({ mView: v });
  });
  return () => sub.remove();
}
