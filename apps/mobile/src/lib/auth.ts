import { useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import type { Provider } from '@headboard/core';
import { api } from './api';
import { useStore } from '../store/useStore';
import { startSync } from '../store/sync';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_IOS = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || undefined;
const GOOGLE_ANDROID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() || undefined;
const GOOGLE_WEB = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || undefined;
export const GOOGLE_CONFIGURED = !!(Platform.OS === 'ios' ? GOOGLE_IOS : Platform.OS === 'android' ? GOOGLE_ANDROID : GOOGLE_WEB);

const msg = {
  offline: (ru: boolean) => (ru ? 'Сервер недоступен — локальный режим' : 'Server unavailable — working locally'),
  cancelled: (ru: boolean) => (ru ? 'Вход отменён' : 'Sign-in cancelled'),
  failed: (ru: boolean) => (ru ? 'Не удалось войти' : 'Sign-in failed'),
  appleNA: (ru: boolean) => (ru ? 'Вход через Apple недоступен на этом устройстве' : 'Sign in with Apple is not available on this device'),
};
const ru = () => useStore.getState().lang === 'ru';

async function finish(p: Promise<{ token: string; user: import('@headboard/core').User }>) {
  const r = await p;
  useStore.getState().setAuth(r.token, r.user);
  await startSync();
}

/** Development login through the API, or the prototype's mock user when there is no API. */
export async function devOrMockSignIn(provider: Provider): Promise<void> {
  const st = useStore.getState();
  if (!api) { st.signIn(provider); return; }
  try {
    const email = provider === 'Apple' ? 'sam.kern@icloud.com' : 'sam.kern@gmail.com';
    await finish(api.auth.dev(email, 'Sam Kern', provider));
  } catch {
    st.toast(msg.offline(ru()));
    st.signIn(provider);
  }
}

/** Native Sign in with Apple (iOS). The identity token's audience is the app bundle id. */
export async function appleSignIn(): Promise<void> {
  const st = useStore.getState();
  if (!api) { st.signIn('Apple'); return; }
  if (Platform.OS !== 'ios' || !(await AppleAuthentication.isAvailableAsync().catch(() => false))) {
    st.toast(msg.appleNA(ru()));
    return;
  }
  try {
    const cred = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
    });
    if (!cred.identityToken) throw new Error('no_identity_token');
    const name = [cred.fullName?.givenName, cred.fullName?.familyName].filter(Boolean).join(' ') || undefined;
    await finish(api.auth.apple(cred.identityToken, name));
  } catch (e) {
    const code = (e as { code?: string }).code ?? '';
    st.toast(code === 'ERR_REQUEST_CANCELED' ? msg.cancelled(ru()) : msg.failed(ru()));
  }
}

/**
 * Google sign-in via expo-auth-session (system browser, id-token response).
 * Returns `signIn`; falls back to the dev login when no client id exists for this platform.
 */
export function useGoogleSignIn(): { signIn: () => Promise<void>; configured: boolean } {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({ iosClientId: GOOGLE_IOS, androidClientId: GOOGLE_ANDROID, webClientId: GOOGLE_WEB });
  const handled = useRef<typeof response>(null);

  useEffect(() => {
    if (!response || response === handled.current) return;
    handled.current = response;
    const st = useStore.getState();
    if (response.type === 'success') {
      const idToken = response.params.id_token;
      if (!idToken || !api) { st.toast(msg.failed(ru())); return; }
      finish(api.auth.google({ idToken })).catch(() => st.toast(msg.failed(ru())));
    } else if (response.type === 'cancel' || response.type === 'dismiss') {
      st.toast(msg.cancelled(ru()));
    } else if (response.type === 'error') {
      st.toast(msg.failed(ru()));
    }
  }, [response]);

  const signIn = useCallback(async () => {
    if (!GOOGLE_CONFIGURED || !api) { await devOrMockSignIn('Google'); return; }
    if (!request) return;
    await promptAsync();
  }, [request, promptAsync]);

  return { signIn, configured: GOOGLE_CONFIGURED };
}

/** Apple button handler: native flow when possible, otherwise dev/mock login. */
export async function appleOrDevSignIn(): Promise<void> {
  const available = Platform.OS === 'ios' && (await AppleAuthentication.isAvailableAsync().catch(() => false));
  if (api && available) await appleSignIn(); else await devOrMockSignIn('Apple');
}
