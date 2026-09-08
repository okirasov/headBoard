import { createApi, type Api } from '@headboard/core';
import { useStore } from '../store/useStore';

/** API client when VITE_API_URL is configured; null means local-only mode (localStorage). */
export const API_URL: string | null = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || null;
export const api: Api | null = API_URL ? createApi(API_URL, () => useStore.getState().token) : null;
