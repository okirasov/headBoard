/** Minimal typings for the Google Identity Services and Sign in with Apple JS globals loaded at runtime. */
interface GoogleCodeClientConfig {
  client_id: string;
  scope: string;
  ux_mode: 'popup' | 'redirect';
  callback: (res: { code?: string; error?: string }) => void;
  error_callback?: (err: { type: string }) => void;
}
interface Window {
  google?: { accounts: { oauth2: { initCodeClient(cfg: GoogleCodeClientConfig): { requestCode(): void } } } };
  AppleID?: {
    auth: {
      init(cfg: { clientId: string; scope: string; redirectURI: string; usePopup: boolean; state?: string }): void;
      signIn(): Promise<{ authorization: { id_token: string; code: string }; user?: { name?: { firstName?: string; lastName?: string }; email?: string } }>;
    };
  };
}
