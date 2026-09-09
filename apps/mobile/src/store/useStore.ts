import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import {
  type CaptureItem, type ColumnKey, type FileRef, type Lang, type Priority, type Project, type Provider, type Task, type Theme,
  type User, type View, newTask, dict, statusLabel, phrases, fmtDate, sizeHuman,
} from '@headboard/core';

export const STORAGE_KEY = 'headboard-v1';
export const TOAST_MS = 2400;

export interface Preview { name: string; sizeL: string; src: string | null; extL: string }

export interface PersistedSlice {
  tasks: Task[]; projects: Project[]; projFiles: Record<string, FileRef[]>; digestText: string | null; digestAt: number | null;
  user: User | null; lang: Lang; theme: Theme; showDone: boolean;
  /** API JWT when signed in through apps/api; null in local-only mode. */
  token: string | null;
}
export interface UiSlice {
  mView: View; mCol: ColumnKey; mSel: string | null; mCapOpen: boolean; mProfOpen: boolean; mPv: Preview | null;
  capText: string; capItems: CaptureItem[] | null; capBusy: boolean;
  calSel: number | null; snack: string | null; zTask: string | null; zMonth: number; cmText: string;
  digestBusy: boolean; digestSeed: number;
}
export interface Actions {
  set: (patch: Partial<UiSlice & PersistedSlice>) => void;
  patchTask: (id: string, up: Partial<Task>) => void;
  moveTask: (id: string, status: ColumnKey) => void;
  toggleDone: (id: string) => void;
  bump: (id: string) => void;
  keep: (id: string) => void;
  snooze: (id: string, until: number) => void;
  archive: (id: string) => void;
  restore: (id: string) => void;
  deleteTask: (id: string) => void;
  setPriority: (id: string, pr: Priority) => void;
  addComment: (id: string, text: string) => void;
  attachFiles: (id: string, files: FileRef[]) => void;
  removeFile: (id: string, fileId: string) => void;
  addTasks: (items: CaptureItem[]) => void;
  setLang: (lang: Lang) => void;
  setTheme: (theme: Theme) => void;
  signIn: (provider: Provider, user?: Partial<User>) => void;
  setAuth: (token: string, user: User) => void;
  signOut: () => void;
  toast: (msg: string) => void;
  openSnooze: (id: string) => void;
  closeSnooze: () => void;
  openPreview: (f: FileRef) => void;
  loadSeed: (tasks: Task[], projects: Project[], projFiles: Record<string, FileRef[]>) => void;
}
export type Store = PersistedSlice & UiSlice & Actions;

const initialPersisted: PersistedSlice = { tasks: [], projects: [], projFiles: {}, digestText: null, digestAt: null, user: null, lang: 'en', theme: 'light', showDone: true, token: null };
const initialUi: UiSlice = {
  mView: 'board', mCol: 'focus', mSel: null, mCapOpen: false, mProfOpen: false, mPv: null,
  capText: '', capItems: null, capBusy: false, calSel: null, snack: null, zTask: null, zMonth: 0, cmText: '', digestBusy: false, digestSeed: 0,
};
let toastTimer: ReturnType<typeof setTimeout> | undefined;

export function fileExt(name: string): string {
  return (String(name || '').split('.').pop() || 'file').toUpperCase().slice(0, 5);
}
export function initialsOf(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]!.toUpperCase()).join('');
}
export function systemTheme(): Theme {
  return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
}

export const useStore = create<Store>()(
  persist(
    (set, get) => {
      const patchTasks = (fn: (t: Task) => Task) => set(s => ({ tasks: s.tasks.map(fn) }));
      const patchTask: Actions['patchTask'] = (id, up) => patchTasks(t => (t.id === id ? { ...t, ...up } : t));
      const toast: Actions['toast'] = msg => { clearTimeout(toastTimer); set({ snack: msg }); toastTimer = setTimeout(() => set({ snack: null }), TOAST_MS); };
      const T = () => dict(get().lang);
      return {
        ...initialPersisted, ...initialUi,
        set: patch => set(patch),
        patchTask,
        moveTask: (id, status) => { const now = Date.now(); patchTask(id, { status, touched: now, doneAt: status === 'done' ? now : null }); toast(T().tMoved + statusLabel(status, get().lang)); },
        toggleDone: id => {
          const t = get().tasks.find(x => x.id === id); if (!t) return;
          const now = Date.now(); const done = t.status === 'done';
          patchTask(id, { status: done ? 'focus' : 'done', doneAt: done ? null : now, touched: now });
          toast(done ? T().tReopen : T().tDoneS);
        },
        bump: id => { patchTask(id, { touched: Date.now(), snoozedUntil: 0 }); toast(T().tBump); },
        keep: id => { patchTask(id, { touched: Date.now(), snoozedUntil: 0 }); toast(T().tKeep); },
        snooze: (id, until) => { patchTask(id, { snoozedUntil: until }); set({ zTask: null, mSel: null }); toast(T().zUntil + fmtDate(until, get().lang)); },
        archive: id => { patchTask(id, { status: 'archived', archivedAt: Date.now() }); set(s => ({ mSel: s.mSel === id ? null : s.mSel })); toast(T().tArch); },
        restore: id => { patchTask(id, { status: 'inbox', archivedAt: null, touched: Date.now() }); set(s => ({ mSel: s.mSel === id ? null : s.mSel })); toast(T().tRestored); },
        deleteTask: id => { set(s => ({ tasks: s.tasks.filter(t => t.id !== id), mSel: s.mSel === id ? null : s.mSel })); toast(T().tDeleted); },
        setPriority: (id, pr) => patchTask(id, { pr }),
        addComment: (id, text) => {
          const txt = text.trim(); if (!txt) return;
          patchTask(id, { comments: [...(get().tasks.find(t => t.id === id)?.comments ?? []), { id: 'c' + Date.now(), text: txt, at: Date.now() }] });
          set({ cmText: '' });
        },
        attachFiles: (id, files) => { if (!files.length) return; patchTasks(t => (t.id === id ? { ...t, files: [...t.files, ...files] } : t)); toast(phrases.attached(files.length, get().lang)); },
        removeFile: (id, fileId) => patchTasks(t => (t.id === id ? { ...t, files: t.files.filter(f => f.id !== fileId) } : t)),
        addTasks: items => {
          const now = Date.now();
          const fresh = items.map((x, i) => newTask({ id: 'n' + now + i, title: x.title, proj: x.proj, pr: x.pr, tags: x.tags }, now));
          set(s => ({ tasks: [...fresh, ...s.tasks], mCapOpen: false, capText: '', capItems: null }));
          toast(phrases.addedToInbox(fresh.length, get().lang));
        },
        setLang: lang => set({ lang }),
        setTheme: theme => set({ theme }),
        signIn: (provider, user) => {
          const name = user?.name ?? 'Sam Kern';
          set({ user: { name, email: user?.email ?? (provider === 'Apple' ? 'sam.kern@icloud.com' : 'sam.kern@gmail.com'), provider, initials: user?.initials ?? initialsOf(name) }, mProfOpen: false });
        },
        setAuth: (token, user) => set({ token, user, mProfOpen: false }),
        signOut: () => set(s => ({ user: null, mProfOpen: false, mSel: null, token: null, ...(s.token ? { tasks: [], projects: [], projFiles: {}, digestText: null, digestAt: null } : {}) })),
        toast,
        openSnooze: id => set({ zTask: id, zMonth: 0 }),
        closeSnooze: () => set({ zTask: null }),
        openPreview: f => set({ mPv: { name: f.name, sizeL: f.size ? sizeHuman(f.size) : '', src: f.kind === 'img' ? f.src ?? null : null, extL: fileExt(f.name) } }),
        loadSeed: (tasks, projects, projFiles) => set({ tasks, projects, projFiles }),
      };
    },
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: s => ({ tasks: s.tasks, projects: s.projects, projFiles: s.projFiles, digestText: s.digestText, digestAt: s.digestAt, user: s.user, lang: s.lang, theme: s.theme, showDone: s.showDone, token: s.token }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<PersistedSlice>;
        return { ...current, ...p, theme: p.theme ?? systemTheme() };
      },
    },
  ),
);

export function selectSelectedTask(s: Store): Task | null {
  return s.mSel ? s.tasks.find(t => t.id === s.mSel) ?? null : null;
}
