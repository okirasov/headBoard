import { createApi, type Api } from '@headboard/core';
import { useStore } from '../store/useStore';

/** Build-time default from EXPO_PUBLIC_API_URL; the profile/sign-in screen can override it at runtime. */
export const API_URL: string | null = process.env.EXPO_PUBLIC_API_URL?.trim() || null;

/** The address requests go to right now: the saved override, else the build-time default. */
export function effectiveApiUrl(): string | null {
  return useStore.getState().apiUrl || API_URL;
}

/** API client when any address is known; null means local-only mode (AsyncStorage). */
export const api: Api | null = API_URL ? createApi(() => effectiveApiUrl() ?? API_URL, () => useStore.getState().token) : null;
