/** Browser-side provider flows. Each returns what the API needs and throws on cancel/failure. */
const GIS_SRC = 'https://accounts.google.com/gsi/client';
const APPLE_SRC = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';

export const GOOGLE_CLIENT_ID: string | null = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() || null;
export const APPLE_SERVICES_ID: string | null = (import.meta.env.VITE_APPLE_SERVICES_ID as string | undefined)?.trim() || null;
const APPLE_REDIRECT_URI: string = (import.meta.env.VITE_APPLE_REDIRECT_URI as string | undefined)?.trim() || (typeof location !== 'undefined' ? location.origin : '');

const loaded = new Map<string, Promise<void>>();
export function loadScript(src: string): Promise<void> {
  let p = loaded.get(src);
  if (!p) {
    p = new Promise<void>((resolve, reject) => {
      const el = document.createElement('script');
      el.src = src; el.async = true; el.defer = true;
      el.onload = () => resolve();
      el.onerror = () => { loaded.delete(src); reject(new Error('script_load_failed')); };
      document.head.appendChild(el);
    });
    loaded.set(src, p);
  }
  return p;
}

/** Google code flow in a popup (custom button allowed). The API exchanges the code with the web client secret. */
export async function googleAuthorizationCode(): Promise<string> {
  if (!GOOGLE_CLIENT_ID) throw new Error('google_not_configured');
  await loadScript(GIS_SRC);
  const g = window.google;
  if (!g) throw new Error('gis_unavailable');
  return new Promise<string>((resolve, reject) => {
    const client = g.accounts.oauth2.initCodeClient({
      client_id: GOOGLE_CLIENT_ID as string,
      scope: 'openid email profile',
      ux_mode: 'popup',
      callback: res => (res.code ? resolve(res.code) : reject(new Error(res.error || 'google_no_code'))),
      error_callback: err => reject(new Error(err.type || 'google_error')),
    });
    client.requestCode();
  });
}

/** Sign in with Apple JS in popup mode; returns the id-token and the name Apple provides on first sign-in. */
export async function appleIdToken(): Promise<{ idToken: string; name?: string }> {
  if (!APPLE_SERVICES_ID) throw new Error('apple_not_configured');
  await loadScript(APPLE_SRC);
  const a = window.AppleID;
  if (!a) throw new Error('apple_js_unavailable');
  a.auth.init({ clientId: APPLE_SERVICES_ID, scope: 'name email', redirectURI: APPLE_REDIRECT_URI, usePopup: true });
  const res = await a.auth.signIn();
  const n = res.user?.name;
  const name = [n?.firstName, n?.lastName].filter(Boolean).join(' ') || undefined;
  return { idToken: res.authorization.id_token, name };
}
