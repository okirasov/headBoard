import type { CaptureItem, Comment, FileRef, Lang, Project, Task, Theme, User } from './model';
import type { DigestStats } from './digest';

export interface AuthResponse { token: string; user: User }
export interface Settings { lang: Lang; theme: Theme; showDone: boolean; digestText: string | null }
export interface ProjectWithFiles extends Project { files?: FileRef[] }

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
      google: (idToken: string) => req<AuthResponse>('POST', '/auth/google', { idToken }),
      apple: (idToken: string) => req<AuthResponse>('POST', '/auth/apple', { idToken }),
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
      upload: (file: Blob, name: string, target: { taskId?: string; projectId?: string }) => {
        const fd = new FormData();
        fd.append('file', file, name);
        const q = target.taskId ? '?taskId=' + encodeURIComponent(target.taskId) : target.projectId ? '?projectId=' + encodeURIComponent(target.projectId) : '';
        return req<FileRef>('POST', '/files' + q, undefined, fd);
      },
      contentUrl: (id: string) => base + '/files/' + encodeURIComponent(id) + '/content',
      remove: (id: string) => req<void>('DELETE', '/files/' + encodeURIComponent(id)),
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
