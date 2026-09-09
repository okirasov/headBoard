import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  type CaptureItem, type FileRef, type Lang, type Priority, type Project, type Provider, type Status, type Task, type Theme,
  type User, type View, type ColumnKey, newTask, dict, statusLabel, phrases, fmtDate,
} from '@headboard/core';

export const STORAGE_KEY = 'headboard-v1';
export const TOAST_MS = 2400;

export interface Preview { name: string; sizeL: string; src: string | null; extL: string }

export interface PersistedSlice {
  tasks: Task[];
  projects: Project[];
  projFiles: Record<string, FileRef[]>;
  digestText: string | null;
  /** Server-owned time of the last digest change (08:00 scheduler or manual regenerate). */
  digestAt: number | null;
  user: User | null;
  lang: Lang;
  theme: Theme;
  showDone: boolean;
  /** API JWT when signed in through apps/api; null in local-only mode. */
  token: string | null;
}

export interface UiSlice {
  view: View;
  q: string;
  fPr: Priority | null;
  fProj: string | null;
  sel: string | null;
  capOpen: boolean;
  capText: string;
  capItems: CaptureItem[] | null;
  capBusy: boolean;
  calSel: number | null;
  snack: string | null;
  pv: Preview | null;
  zTask: string | null;
  zMonth: number;
  profOpen: boolean;
  dragId: string | null;
  dragCol: ColumnKey | null;
  cmText: string;
  digestBusy: boolean;
  digestSeed: number;
}

export interface Actions {
  set: (patch: Partial<UiSlice & PersistedSlice>) => void;
  patchTask: (id: string, up: Partial<Task>) => void;
  moveTask: (id: string, status: ColumnKey) => void;
  toggleDone: (id: string) => void;
  markDone: (id: string) => void;
  bump: (id: string) => void;
  snooze: (id: string, until: number) => void;
  archive: (id: string) => void;
  restore: (id: string) => void;
  deleteTask: (id: string) => void;
  keep: (id: string) => void;
  setPriority: (id: string, pr: Priority) => void;
  addComment: (id: string, text: string) => void;
  attachFiles: (id: string, files: FileRef[]) => void;
  removeFile: (id: string, fileId: string) => void;
  attachProjFiles: (projId: string, files: FileRef[]) => void;
  removeProjFile: (projId: string, fileId: string) => void;
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

const initialPersisted: PersistedSlice = {
  tasks: [], projects: [], projFiles: {}, digestText: null, digestAt: null, user: null, lang: 'en', theme: 'light', showDone: true, token: null,
};

const initialUi: UiSlice = {
  view: 'board', q: '', fPr: null, fProj: null, sel: null,
  capOpen: false, capText: '', capItems: null, capBusy: false,
  calSel: null, snack: null, pv: null, zTask: null, zMonth: 0, profOpen: false,
  dragId: null, dragCol: null, cmText: '', digestBusy: false, digestSeed: 0,
};

let toastTimer: ReturnType<typeof setTimeout> | undefined;

export function fileExt(name: string): string {
  return (String(name || '').split('.').pop() || 'file').toUpperCase().slice(0, 5);
}

export function initialsOf(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]!.toUpperCase()).join('');
}

export function applyThemeClass(theme: Theme) {
  if (typeof document !== 'undefined') document.documentElement.classList.toggle('dark', theme === 'dark');
}

export function systemTheme(): Theme {
  try {
    return typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export const useStore = create<Store>()(
  persist(
    (set, get) => {
      const patchTasks = (fn: (t: Task) => Task) => set(s => ({ tasks: s.tasks.map(fn) }));
      const patchTask: Actions['patchTask'] = (id, up) => patchTasks(t => (t.id === id ? { ...t, ...up } : t));
      const toast: Actions['toast'] = msg => {
        clearTimeout(toastTimer);
        set({ snack: msg });
        toastTimer = setTimeout(() => set({ snack: null }), TOAST_MS);
      };
      const T = () => dict(get().lang);
      return {
        ...initialPersisted,
        ...initialUi,
        set: patch => set(patch),
        patchTask,
        moveTask: (id, status) => {
          const now = Date.now();
          patchTask(id, { status, touched: now, doneAt: status === 'done' ? now : null });
          toast(T().tMoved + statusLabel(status, get().lang));
        },
        markDone: id => {
          const now = Date.now();
          patchTask(id, { status: 'done', doneAt: now, touched: now });
          toast(T().tDone);
        },
        toggleDone: id => {
          const t = get().tasks.find(x => x.id === id);
          if (!t) return;
          const now = Date.now();
          const done = t.status === 'done';
          patchTask(id, { status: done ? 'focus' : 'done', doneAt: done ? null : now, touched: now });
          toast(done ? T().tReopen : T().tDoneS);
        },
        bump: id => {
          patchTask(id, { touched: Date.now(), snoozedUntil: 0 });
          toast(T().tBump);
        },
        keep: id => {
          patchTask(id, { touched: Date.now(), snoozedUntil: 0 });
          toast(T().tKeep);
        },
        snooze: (id, until) => {
          patchTask(id, { snoozedUntil: until });
          set({ zTask: null, sel: null });
          toast(T().zUntil + fmtDate(until, get().lang));
        },
        archive: id => {
          patchTask(id, { status: 'archived' as Status, archivedAt: Date.now() });
          set(s => ({ sel: s.sel === id ? null : s.sel }));
          toast(T().tArch);
        },
        restore: id => {
          patchTask(id, { status: 'inbox', archivedAt: null, touched: Date.now() });
          set(s => ({ sel: s.sel === id ? null : s.sel }));
          toast(T().tRestored);
        },
        deleteTask: id => {
          set(s => ({ tasks: s.tasks.filter(t => t.id !== id), sel: s.sel === id ? null : s.sel }));
          toast(T().tDeleted);
        },
        setPriority: (id, pr) => patchTask(id, { pr }),
        addComment: (id, text) => {
          const txt = text.trim();
          if (!txt) return;
          patchTask(id, { comments: [...(get().tasks.find(t => t.id === id)?.comments ?? []), { id: 'c' + Date.now(), text: txt, at: Date.now() }] });
          set({ cmText: '' });
        },
        attachFiles: (id, files) => {
          if (!files.length) return;
          patchTasks(t => (t.id === id ? { ...t, files: [...t.files, ...files] } : t));
          toast(phrases.attached(files.length, get().lang));
        },
        removeFile: (id, fileId) => patchTasks(t => (t.id === id ? { ...t, files: t.files.filter(f => f.id !== fileId) } : t)),
        attachProjFiles: (projId, files) => {
          if (!files.length) return;
          set(s => ({ projFiles: { ...s.projFiles, [projId]: [...(s.projFiles[projId] ?? []), ...files] } }));
          toast(phrases.attached(files.length, get().lang));
        },
        removeProjFile: (projId, fileId) =>
          set(s => ({ projFiles: { ...s.projFiles, [projId]: (s.projFiles[projId] ?? []).filter(f => f.id !== fileId) } })),
        addTasks: items => {
          const now = Date.now();
          const fresh = items.map((x, i) => newTask({ id: 'n' + now + i, title: x.title, proj: x.proj, pr: x.pr, tags: x.tags }, now));
          set(s => ({ tasks: [...fresh, ...s.tasks], capOpen: false, capText: '', capItems: null }));
          toast(phrases.addedToInbox(fresh.length, get().lang));
        },
        setLang: lang => set({ lang }),
        setTheme: theme => {
          set({ theme });
          applyThemeClass(theme);
        },
        signIn: (provider, user) => {
          const name = user?.name ?? 'Sam Kern';
          set({
            user: {
              name,
              email: user?.email ?? (provider === 'Apple' ? 'sam.kern@icloud.com' : 'sam.kern@gmail.com'),
              provider,
              initials: user?.initials ?? initialsOf(name),
            },
            profOpen: false,
          });
        },
        setAuth: (token, user) => set({ token, user, profOpen: false }),
        signOut: () => set(s => ({ user: null, profOpen: false, sel: null, token: null, ...(s.token ? { tasks: [], projects: [], projFiles: {}, digestText: null, digestAt: null } : {}) })),
        toast,
        openSnooze: id => set({ zTask: id, zMonth: 0 }),
        closeSnooze: () => set({ zTask: null }),
        openPreview: f => set({ pv: { name: f.name, sizeL: f.size ? sizeHumanSafe(f.size) : '', src: f.src ?? null, extL: fileExt(f.name) } }),
        loadSeed: (tasks, projects, projFiles) => set({ tasks, projects, projFiles }),
      };
    },
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => safeStorage()),
      partialize: s => ({
        tasks: s.tasks, projects: s.projects, projFiles: s.projFiles, digestText: s.digestText,
        digestAt: s.digestAt, user: s.user, lang: s.lang, theme: s.theme, showDone: s.showDone, token: s.token,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<PersistedSlice>;
        // theme: persisted choice, else system
        const theme: Theme = p.theme ?? systemTheme();
        return { ...current, ...p, theme };
      },
    },
  ),
);

/** localStorage when available (browser); otherwise an in-memory stand-in (tests, SSR). */
function safeStorage(): Storage {
  try {
    if (typeof localStorage !== 'undefined' && localStorage && typeof localStorage.getItem === 'function') return localStorage;
  } catch { /* access denied */ }
  const mem = new Map<string, string>();
  return {
    get length() { return mem.size; },
    clear: () => mem.clear(),
    getItem: k => mem.get(k) ?? null,
    key: i => Array.from(mem.keys())[i] ?? null,
    removeItem: k => { mem.delete(k); },
    setItem: (k, v) => { mem.set(k, String(v)); },
  } as Storage;
}

function sizeHumanSafe(b: number): string {
  return b > 9e5 ? (b / 1e6).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1000)) + ' KB';
}

/** Selected (open) task; archived tasks open too (read-only status, Restore/Delete actions). */
export function selectSelectedTask(s: Store): Task | null {
  return s.sel ? s.tasks.find(t => t.id === s.sel) ?? null : null;
}
