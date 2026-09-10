import { useEffect } from 'react';
import type { View } from '@headboard/core';
import { useStore } from '../store/useStore';

/** Views reachable with the digit keys 1–9, in sidebar order. */
export const VIEW_KEYS: View[] = ['board', 'review', 'digest', 'calendar', 'due', 'recurring', 'stats', 'search', 'history'];

function inEditable(e: KeyboardEvent): boolean {
  const el = e.target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

/**
 * Global keyboard shortcuts (web). Ignored while typing in a field, except Esc.
 *   c / n  capture        /  focus search        ?  help
 *   1–9    switch view    d  done (open task)    a  archive (open task)   s  snooze (open task)
 *   Esc    close drawer, modal, menu, or clear the selection
 */
export function useShortcuts(): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const st = useStore.getState();
      if (e.key === 'Escape') {
        if (inEditable(e)) { (e.target as HTMLElement).blur(); return; }
        if (st.helpOpen) st.set({ helpOpen: false });
        else if (st.pv) st.set({ pv: null });
        else if (st.zTask) st.closeSnooze();
        else if (st.capOpen) st.set({ capOpen: false });
        else if (st.profOpen) st.set({ profOpen: false });
        else if (st.sel) st.set({ sel: null });
        else if (st.selected.length) st.clearSelection();
        return;
      }
      if (inEditable(e) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (!st.user) return;
      const k = e.key;
      if (k === '?') { st.set({ helpOpen: !st.helpOpen }); e.preventDefault(); return; }
      if (k === 'c' || k === 'n') { st.set({ capOpen: true, view: st.view === 'board' ? st.view : 'board' }); e.preventDefault(); return; }
      if (k === '/') { const el = document.querySelector<HTMLInputElement>('input[data-search]'); el?.focus(); el?.select(); e.preventDefault(); return; }
      if (/^[1-9]$/.test(k)) { const v = VIEW_KEYS[Number(k) - 1]; if (v) st.set({ view: v, sel: null }); return; }
      if (st.sel) {
        if (k === 'd') { st.toggleDone(st.sel); st.set({ sel: null }); return; }
        if (k === 'a') { st.archive(st.sel); return; }
        if (k === 's') { st.openSnooze(st.sel); return; }
        if (k === 'b') { st.bump(st.sel); st.set({ sel: null }); return; }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
