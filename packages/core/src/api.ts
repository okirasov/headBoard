import type { CaptureItem, Comment, FileRef, Lang, Project, Task, Theme, User } from './model';
import type { DigestStats } from './digest';

export interface AuthResponse { token: string; user: User }
export interface Settings {
  lang: Lang; theme: Theme; showDone: boolean; digestText: string | null;
  /** When the digest text last changed (server-owned; the 08:00 scheduler and manual regeneration both set it). */
  digestAt?: number | null;
  /** IANA time zone the scheduler uses for this user's 08:00. */
  timeZone?: string | null;
  /** Daily push about forgotten tasks. */
  notifyStale?: boolean;
  /** Morning push about tasks due today / tomorrow (per-task `remindDays`). */
  notifyDue?: boolean;
}
export interface PushConfig { webPush: boolean; vapidPublicKey: string | null; expo: boolean }
export interface PushSubscriptionInfo { id: string; kind: 'webpush' | 'expo'; label: string | null; createdAt: number; lastSentAt: number | null }
export interface ProjectWithFiles extends Project { files?: FileRef[] }
export interface CalendarStatus { available: boolean; connected: boolean; calendarId: string | null; lastSyncAt: number | null; lastError: string | null; connectedAt: number | null }

export class ApiError extends Error {
  constructor(public status: number, public code: string, message?: string) {
    super(message ?? code);
  }
}

/** Typed client for the Headboard API (apps/api). `getToken` supplies the JWT once signed in. */
export function createApi(baseUrl: string, getToken: () => string | null) {
  const base = baseUrl.replace(/\/$/, '');

  async function req<T>(method: string, path: string, body?: unknown, raw?: BodyInit): Promise<T> {
    const headers: Record<string, string> = {};
    const token = getToken();
    if (token) headers.Authorization = 'Bearer ' + token;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const res = await fetch(base + path, { method, headers, body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined) });
    if (!res.ok) {
      let code = 'http_' + res.status;
      try { const j = await res.json(); if (j && typeof j.error === 'string') code = j.error; } catch { /* no body */ }
      throw new ApiError(res.status, code);
    }
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }

  return {
    auth: {
      /** Native apps send the id-token; the web code-flow popup sends the authorization code (redirectUri `postmessage`). */
      google: (body: { idToken?: string; code?: string; redirectUri?: string }) => req<AuthResponse>('POST', '/auth/google', body),
      /** `name` is only available on the first Apple sign-in and is passed alongside the token. */
      apple: (idToken: string, name?: string) => req<AuthResponse>('POST', '/auth/apple', { idToken, name }),
      dev: (email: string, name: string, provider: 'Google' | 'Apple') => req<AuthResponse>('POST', '/auth/dev', { email, name, provider }),
      me: () => req<User>('GET', '/me'),
    },
    tasks: {
      list: (includeArchived = false) => req<Task[]>('GET', '/tasks' + (includeArchived ? '?includeArchived=true' : '')),
      create: (t: Task) => req<Task>('POST', '/tasks', t),
      patch: (id: string, up: Partial<Task>) => req<Task>('PATCH', '/tasks/' + encodeURIComponent(id), up),
      remove: (id: string) => req<void>('DELETE', '/tasks/' + encodeURIComponent(id)),
      addComment: (id: string, text: string) => req<Comment>('POST', '/tasks/' + encodeURIComponent(id) + '/comments', { text }),
      removeComment: (id: string, cid: string) => req<void>('DELETE', '/tasks/' + encodeURIComponent(id) + '/comments/' + encodeURIComponent(cid)),
    },
    projects: {
      list: () => req<ProjectWithFiles[]>('GET', '/projects'),
      create: (p: Project) => req<Project>('POST', '/projects', p),
      patch: (id: string, up: Partial<Project>) => req<Project>('PATCH', '/projects/' + encodeURIComponent(id), up),
      remove: (id: string) => req<void>('DELETE', '/projects/' + encodeURIComponent(id)),
    },
    files: {
      /** `part` is a Blob on web or a `{uri, name, type}` descriptor in React Native. */
      upload: (part: Blob | { uri: string; name: string; type: string }, name: string, target: { taskId?: string; projectId?: string }) => {
        const fd = new FormData();
        if (part instanceof Blob) fd.append('file', part, name); else fd.append('file', part as unknown as Blob);
        const q = target.taskId ? '?taskId=' + encodeURIComponent(target.taskId) : target.projectId ? '?projectId=' + encodeURIComponent(target.projectId) : '';
        return req<FileRef>('POST', '/files' + q, undefined, fd);
      },
      contentUrl: (id: string) => base + '/files/' + encodeURIComponent(id) + '/content',
      remove: (id: string) => req<void>('DELETE', '/files/' + encodeURIComponent(id)),
    },
    push: {
      config: () => req<PushConfig>('GET', '/push/config'),
      list: () => req<PushSubscriptionInfo[]>('GET', '/push/subscriptions'),
      subscribeWeb: (sub: { endpoint: string; keys: { p256dh: string; auth: string } }, label?: string) => req<PushSubscriptionInfo>('POST', '/push/subscribe', { kind: 'webpush', endpoint: sub.endpoint, keys: sub.keys, label }),
      subscribeExpo: (token: string, label?: string) => req<PushSubscriptionInfo>('POST', '/push/subscribe', { kind: 'expo', token, label }),
      unsubscribe: (endpointOrToken: string) => req<void>('DELETE', '/push/subscribe', { endpoint: endpointOrToken }),
      test: () => req<{ sent: number }>('POST', '/push/test'),
    },
    calendar: {
      status: () => req<CalendarStatus>('GET', '/calendar'),
      /** Returns the Google consent URL; the browser/system browser is sent there and comes back to `returnUrl?calendar=connected|denied|error`. */
      connect: (returnUrl: string) => req<{ url: string }>('POST', '/calendar/connect', { returnUrl }),
      syncNow: () => req<CalendarStatus>('POST', '/calendar/sync'),
      disconnect: () => req<void>('DELETE', '/calendar'),
    },
    settings: {
      get: () => req<Settings>('GET', '/settings'),
      put: (s: Settings) => req<Settings>('PUT', '/settings', s),
    },
    ai: {
      extract: (text: string, projects: Project[]) => req<CaptureItem[]>('POST', '/ai/extract', { text, projects: projects.map(p => ({ id: p.id, name: p.name })) }),
      digest: (stats: DigestStats, lang: Lang) => req<{ text: string }>('POST', '/ai/digest', {
        stats: { dueN: stats.dueN, dueFirst: stats.dueFirst, staleN: stats.staleN, oldT: stats.oldT, oldI: stats.oldI, doneW: stats.doneW, focusN: stats.focusN, recN: stats.recN }, lang,
      }),
    },
  };
}
export type Api = ReturnType<typeof createApi>;
