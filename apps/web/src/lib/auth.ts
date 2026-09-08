import type { Provider } from '@headboard/core';
import { api } from './api';
import { useStore } from '../store/useStore';
import { startSync } from '../store/sync';

/**
 * Sign in with a provider. With the API configured this uses the development login
 * (`POST /auth/dev`); production Google/Apple id-token flows plug in here once client ids exist.
 * Without an API the prototype's mock user is used.
 */
export async function signInWith(provider: Provider): Promise<void> {
  const st = useStore.getState();
  if (!api) { st.signIn(provider); return; }
  try {
    const email = provider === 'Apple' ? 'sam.kern@icloud.com' : 'sam.kern@gmail.com';
    const r = await api.auth.dev(email, 'Sam Kern', provider);
    st.setAuth(r.token, r.user);
    await startSync();
  } catch {
    st.toast(st.lang === 'ru' ? 'Сервер недоступен — локальный режим' : 'Server unavailable — working locally');
    st.signIn(provider);
  }
}
