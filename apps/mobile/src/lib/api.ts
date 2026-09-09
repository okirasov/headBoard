import { createApi, type Api } from '@headboard/core';
import { useStore } from '../store/useStore';

/** API client when EXPO_PUBLIC_API_URL is set; null means local-only mode (AsyncStorage). */
export const API_URL: string | null = process.env.EXPO_PUBLIC_API_URL?.trim() || null;
export const api: Api | null = API_URL ? createApi(API_URL, () => useStore.getState().token) : null;
