import type { Provider } from '@headboard/core';
import { api } from './api';
import { useStore } from '../store/useStore';
import { startSync } from '../store/sync';
import { APPLE_SERVICES_ID, GOOGLE_CLIENT_ID, appleIdToken, googleAuthorizationCode } from './providers';

const msg = {
  offline: (ru: boolean) => (ru ? 'Сервер недоступен — локальный режим' : 'Server unavailable — working locally'),
  cancelled: (ru: boolean) => (ru ? 'Вход отменён' : 'Sign-in cancelled'),
  failed: (ru: boolean) => (ru ? 'Не удалось войти' : 'Sign-in failed'),
};

/** True when the browser can run the real flow for this provider (client ids configured). */
export function providerConfigured(provider: Provider): boolean {
  return provider === 'Google' ? !!GOOGLE_CLIENT_ID : !!APPLE_SERVICES_ID;
}

/**
 * Sign in with a provider.
 * 1. No API configured → the prototype's mock user (local-only mode).
 * 2. Provider configured → real Google (code-flow popup) or Apple (popup) → API issues a JWT.
 * 3. Otherwise → API development login (only enabled in Development).
 */
export async function signInWith(provider: Provider): Promise<void> {
  const st = useStore.getState();
  const ru = st.lang === 'ru';
  if (!api) { st.signIn(provider); return; }

  if (providerConfigured(provider)) {
    try {
      const r = provider === 'Google'
        ? await api.auth.google({ code: await googleAuthorizationCode(), redirectUri: 'postmessage' })
        : await (async () => { const { idToken, name } = await appleIdToken(); return api.auth.apple(idToken, name); })();
      st.setAuth(r.token, r.user);
      await startSync();
    } catch (e) {
      const code = (e as Error).message || '';
      st.toast(/popup_closed|user_cancelled|popup_closed_by_user|access_denied/i.test(code) ? msg.cancelled(ru) : msg.failed(ru));
    }
    return;
  }

  try {
    const email = provider === 'Apple' ? 'sam.kern@icloud.com' : 'sam.kern@gmail.com';
    const r = await api.auth.dev(email, 'Sam Kern', provider);
    st.setAuth(r.token, r.user);
    await startSync();
  } catch {
    st.toast(msg.offline(ru));
    st.signIn(provider);
  }
}
