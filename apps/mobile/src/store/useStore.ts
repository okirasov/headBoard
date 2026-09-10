import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import {
  type CaptureItem, type ColumnKey, type FileRef, type Lang, type Priority, type Project, type Provider, type Task, type Theme,
  type User, type View, type Recur, type Template, newTask, newProject, dict, statusLabel, phrases, fmtDate, sizeHuman, rollRecurring, normalizeTags, renameTag, removeTag, applyTemplate, templateFromTask, withHistory, createdEntry } from '@headboard/core';

export const STORAGE_KEY = 'headboard-v1';
export const TOAST_MS = 2400;
export const UNDO_MS = 6000;

export interface Preview { name: string; sizeL: string; src: string | null; extL: string }

export interface PersistedSlice {
  tasks: Task[]; projects: Project[]; templates: Template[]; projFiles: Record<string, FileRef[]>; digestText: string | null; digestAt: number | null; notifyStale: boolean; notifyDue: boolean; staleDays: number;
  user: User | null; lang: Lang; theme: Theme; showDone: boolean;
  /** API JWT when signed in through apps/api; null in local-only mode. */
  token: string | null;
}
export interface UiSlice {
  mView: View; mCol: ColumnKey; mSel: string | null; fTag: string | null; mCapOpen: boolean; mProfOpen: boolean; mPv: Preview | null;
  capText: string; capItems: CaptureItem[] | null; capBusy: boolean; q: string;
  calSel: number | null; snack: string | null; snackUndo: (() => void) | null; zTask: string | null; zMonth: number; cmText: string;
  /** Task whose due date is being picked in the date sheet. */
  dueTask: string | null; dueMonth: number;
  /** Task shown on the History screen; null = recently-changed list. */
  histId: string | null;
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
  setDue: (id: string, due: number | null) => void;
  setRemind: (id: string, remindDays: 0 | 1 | null) => void;
  setRecur: (id: string, recur: Recur) => void;
  setTags: (id: string, tags: string[]) => void;
  addTemplate: (t: Template) => void;
  updateTemplate: (id: string, patch: Partial<Template>) => void;
  deleteTemplate: (id: string) => void;
  saveAsTemplate: (taskId: string) => void;
  useTemplate: (id: string, values: Record<string, string>) => Task | null;
  renameTag: (from: string, to: string) => void;
  deleteTag: (tag: string) => void;
  complete: (id: string) => void;
  addComment: (id: string, text: string) => void;
  editComment: (id: string, cid: string, text: string) => void;
  removeComment: (id: string, cid: string) => void;
  setTitle: (id: string, title: string) => void;
  setNote: (id: string, note: string) => void;
  setProject: (id: string, proj: string | null) => void;
  setChat: (id: string, url: string | null) => void;
  attachFiles: (id: string, files: FileRef[]) => void;
  removeFile: (id: string, fileId: string) => void;
  addTasks: (items: CaptureItem[]) => void;
  addProject: (name: string, color: string) => Project | null;
  updateProject: (id: string, patch: Partial<Pick<Project, 'name' | 'color'>>) => void;
  deleteProject: (id: string) => void;
  setLang: (lang: Lang) => void;
  setTheme: (theme: Theme) => void;
  setStaleDays: (days: number) => void;
  signIn: (provider: Provider, user?: Partial<User>) => void;
  setAuth: (token: string, user: User) => void;
  signOut: () => void;
  toast: (msg: string, undo?: () => void) => void;
  undo: () => void;
  openSnooze: (id: string) => void;
  closeSnooze: () => void;
  openPreview: (f: FileRef) => void;
  loadSeed: (tasks: Task[], projects: Project[], projFiles: Record<string, FileRef[]>) => void;
}
export type Store = PersistedSlice & UiSlice & Actions;

const initialPersisted: PersistedSlice = { tasks: [], projects: [], templates: [], projFiles: {}, digestText: null, digestAt: null, notifyStale: true, notifyDue: true, staleDays: 7, user: null, lang: 'en', theme: 'light', showDone: true, token: null };
const initialUi: UiSlice = {
  mView: 'board', mCol: 'focus', mSel: null, fTag: null, mCapOpen: false, mProfOpen: false, mPv: null,
  capText: '', capItems: null, capBusy: false, q: '', calSel: null, snack: null, snackUndo: null, zTask: null, zMonth: 0, cmText: '', dueTask: null, dueMonth: 0, histId: null, digestBusy: false, digestSeed: 0,
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
      // Every task mutation goes through here, so the change log is a by-product: diff prev → next and append.
      const patchTasks = (fn: (t: Task) => Task) => set(s => { const now = Date.now(); return { tasks: s.tasks.map(t => { const n = fn(t); return n === t ? t : withHistory(t, n, now); }) }; });
      const patchTask: Actions['patchTask'] = (id, up) => patchTasks(t => (t.id === id ? { ...t, ...up } : t));
      const toast: Actions['toast'] = (msg, undo) => { clearTimeout(toastTimer); set({ snack: msg, snackUndo: undo ?? null }); toastTimer = setTimeout(() => set({ snack: null, snackUndo: null }), undo ? UNDO_MS : TOAST_MS); };
      const T = () => dict(get().lang);
      /**
       * Undo support: remember the affected tasks before an action, then offer a toast whose Undo puts those
       * exact versions back (and drops tasks the action created, e.g. the next recurring instance).
       */
      const snapshot = (ids: string[]) => { const before = get().tasks.filter(t => ids.includes(t.id)); const idx = new Map(get().tasks.map((t, i) => [t.id, i])); return { before, idx }; };
      const restoreFn = (snap: { before: Task[]; idx: Map<string, number> }, createdIds: string[] = []) => () => {
        set(s => {
          const rest = s.tasks.filter(t => !createdIds.includes(t.id));
          const merged = rest.map(t => snap.before.find(b => b.id === t.id) ?? t);
          for (const b of snap.before) if (!merged.some(t => t.id === b.id)) merged.splice(Math.min(snap.idx.get(b.id) ?? 0, merged.length), 0, b);
          return { tasks: merged };
        });
        toast(T().tUndone);
      };

      return {
        ...initialPersisted, ...initialUi,
        set: patch => set(patch),
        undo: () => { const u = get().snackUndo; clearTimeout(toastTimer); set({ snack: null, snackUndo: null }); u?.(); },
        patchTask,
        moveTask: (id, status) => { if (status === 'done') { get().complete(id); return; } const now = Date.now(); const snap = snapshot([id]); patchTask(id, { status, touched: now, doneAt: null }); toast(T().tMoved + statusLabel(status, get().lang), restoreFn(snap)); },
        complete: id => {
          const t = get().tasks.find(x => x.id === id); if (!t) return;
          const now = Date.now();
          const snap = snapshot([id]);
          if (t.recur) {
            const { done, next } = rollRecurring(t, now);
            set(s => ({ tasks: [next, ...s.tasks.map(x => (x.id === id ? done : x))], mSel: s.mSel === id ? null : s.mSel }));
            toast(T().tRolled + fmtDate(next.due as number, get().lang), restoreFn(snap, [next.id]));
            return;
          }
          patchTask(id, { status: 'done', doneAt: now, touched: now });
          toast(T().tDoneS, restoreFn(snap));
        },
        toggleDone: id => {
          const t = get().tasks.find(x => x.id === id); if (!t) return;
          const now = Date.now(); const done = t.status === 'done';
          if (!done) { get().complete(id); return; }
          const snap = snapshot([id]);
          patchTask(id, { status: 'focus', doneAt: null, touched: now });
          toast(T().tReopen, restoreFn(snap));
        },
        bump: id => { patchTask(id, { touched: Date.now(), snoozedUntil: 0 }); toast(T().tBump); },
        keep: id => { patchTask(id, { touched: Date.now(), snoozedUntil: 0 }); toast(T().tKeep); },
        snooze: (id, until) => { const snap = snapshot([id]); patchTask(id, { snoozedUntil: until }); set({ zTask: null, mSel: null }); toast(T().zUntil + fmtDate(until, get().lang), restoreFn(snap)); },
        archive: id => { const snap = snapshot([id]); patchTask(id, { status: 'archived', archivedAt: Date.now() }); set(s => ({ mSel: s.mSel === id ? null : s.mSel })); toast(T().tArch, restoreFn(snap)); },
        restore: id => { patchTask(id, { status: 'inbox', archivedAt: null, touched: Date.now() }); set(s => ({ mSel: s.mSel === id ? null : s.mSel })); toast(T().tRestored); },
        deleteTask: id => { const snap = snapshot([id]); set(s => ({ tasks: s.tasks.filter(t => t.id !== id), mSel: s.mSel === id ? null : s.mSel })); toast(T().tDeleted, restoreFn(snap)); },
        setPriority: (id, pr) => patchTask(id, { pr }),
        setDue: (id, due) => { patchTask(id, { due, touched: Date.now(), ...(due === null ? { remindDays: null } : {}) }); set({ dueTask: null }); },
        setRemind: (id, remindDays) => patchTask(id, { remindDays }),
        addTemplate: t => { set(s => ({ templates: [...s.templates, t] })); toast(T().tTemplateSaved); },
        updateTemplate: (id, patch) => set(s => ({ templates: s.templates.map(t => (t.id === id ? { ...t, ...patch } : t)) })),
        deleteTemplate: id => { set(s => ({ templates: s.templates.filter(t => t.id !== id) })); toast(T().tTemplateDeleted); },
        saveAsTemplate: taskId => { const task = get().tasks.find(t => t.id === taskId); if (task) get().addTemplate(templateFromTask(task)); },
        useTemplate: (id, values) => {
          const tpl = get().templates.find(t => t.id === id); if (!tpl) return null;
          const task = applyTemplate(tpl, values, Date.now());
          set(s => ({ tasks: [task, ...s.tasks], templates: s.templates.map(t => (t.id === id ? { ...t, usedCount: t.usedCount + 1 } : t)), mCapOpen: false, mView: 'board', mCol: task.status as 'inbox', mSel: task.id }));
          toast(T().tTemplateApplied);
          return task;
        },
        setTags: (id, tags) => patchTask(id, { tags: normalizeTags(tags) }),
        renameTag: (from, to) => {
          const changed = renameTag(get().tasks, from, to); if (!changed.length) return;
          const merged = get().tasks.some(t => t.tags.includes(normalizeTags([to])[0]) && !t.tags.includes(from));
          const by = new Map(changed.map(t => [t.id, t]));
          set(s => ({ tasks: s.tasks.map(t => by.get(t.id) ?? t), fTag: s.fTag === from ? normalizeTags([to])[0] : s.fTag }));
          toast(merged ? T().tTagMerged : T().tTagRenamed);
        },
        deleteTag: tag => {
          const changed = removeTag(get().tasks, tag); const by = new Map(changed.map(t => [t.id, t]));
          set(s => ({ tasks: s.tasks.map(t => by.get(t.id) ?? t), fTag: s.fTag === tag ? null : s.fTag }));
          toast(T().tTagDeleted);
        },
        setRecur: (id, recur) => { const t = get().tasks.find(x => x.id === id); patchTask(id, { recur, ...(recur && t && t.due === null ? { due: Date.now() } : {}) }); },
        editComment: (id, cid, text) => { const txt = text.trim(); if (!txt) return; patchTasks(t => (t.id === id ? { ...t, comments: t.comments.map(c => (c.id === cid ? { ...c, text: txt } : c)) } : t)); },
        removeComment: (id, cid) => patchTasks(t => (t.id === id ? { ...t, comments: t.comments.filter(c => c.id !== cid) } : t)),
        setTitle: (id, title) => { const v = title.trim().slice(0, 90); if (v) patchTask(id, { title: v }); },
        setNote: (id, note) => patchTask(id, { note }),
        setProject: (id, proj) => patchTask(id, { proj: proj && get().projects.some(p => p.id === proj) ? proj : null }),
        setChat: (id, url) => patchTask(id, { chat: url && /^https?:\/\//i.test(url) ? url : null }),
        addComment: (id, text) => {
          const txt = text.trim(); if (!txt) return;
          patchTask(id, { comments: [...(get().tasks.find(t => t.id === id)?.comments ?? []), { id: 'c' + Date.now(), text: txt, at: Date.now() }] });
          set({ cmText: '' });
        },
        attachFiles: (id, files) => { if (!files.length) return; patchTasks(t => (t.id === id ? { ...t, files: [...t.files, ...files] } : t)); toast(phrases.attached(files.length, get().lang)); },
        removeFile: (id, fileId) => patchTasks(t => (t.id === id ? { ...t, files: t.files.filter(f => f.id !== fileId) } : t)),
        addTasks: items => {
          const now = Date.now();
          const fresh = items.map((x, i) => newTask({ id: 'n' + now + i, title: x.title, proj: x.proj, pr: x.pr, tags: normalizeTags(x.tags), history: [createdEntry(now, 'capture')] }, now));
          set(s => ({ tasks: [...fresh, ...s.tasks], mCapOpen: false, capText: '', capItems: null }));
          toast(phrases.addedToInbox(fresh.length, get().lang));
        },
        addProject: (name, color) => {
          if (!name.trim()) return null;
          const p = newProject(name, color);
          set(s => ({ projects: [...s.projects, p] }));
          toast(T().tProjectAdded);
          return p;
        },
        updateProject: (id, patch) => set(s => ({ projects: s.projects.map(p => (p.id === id ? { ...p, ...patch, name: (patch.name ?? p.name).trim() || p.name } : p)) })),
        deleteProject: id => {
          set(s => {
            const { [id]: _dropped, ...projFiles } = s.projFiles;
            return { projects: s.projects.filter(p => p.id !== id), tasks: s.tasks.map(t => (t.proj === id ? { ...t, proj: null } : t)), projFiles };
          });
          toast(T().tProjectDeleted);
        },
        setLang: lang => set({ lang }),
        setTheme: theme => set({ theme }),
        setStaleDays: days => set({ staleDays: Math.min(60, Math.max(1, Math.round(days))) }),
        signIn: (provider, user) => {
          const name = user?.name ?? 'Sam Kern';
          set({ user: { name, email: user?.email ?? (provider === 'Apple' ? 'sam.kern@icloud.com' : 'sam.kern@gmail.com'), provider, initials: user?.initials ?? initialsOf(name) }, mProfOpen: false });
        },
        setAuth: (token, user) => set({ token, user, mProfOpen: false }),
        signOut: () => set(s => ({ user: null, mProfOpen: false, mSel: null, token: null, ...(s.token ? { tasks: [], projects: [], templates: [], projFiles: {}, digestText: null, digestAt: null } : {}) })),
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
      partialize: s => ({ tasks: s.tasks, projects: s.projects, templates: s.templates, projFiles: s.projFiles, digestText: s.digestText, digestAt: s.digestAt, notifyStale: s.notifyStale, notifyDue: s.notifyDue, staleDays: s.staleDays, user: s.user, lang: s.lang, theme: s.theme, showDone: s.showDone, token: s.token }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<PersistedSlice>;
        const tasks = (p.tasks ?? current.tasks).map(t => (t.history && t.seriesId !== undefined ? t : { ...t, history: t.history ?? [], seriesId: t.seriesId ?? null }));
        return { ...current, ...p, tasks, theme: p.theme ?? systemTheme() };
      },
    },
  ),
);

export function selectSelectedTask(s: Store): Task | null {
  return s.mSel ? s.tasks.find(t => t.id === s.mSel) ?? null : null;
}
