import { useEffect } from 'react';
import { dict } from '@headboard/core';
import { useStore, applyThemeClass } from './store/useStore';
import { startSync, refreshSettings } from './store/sync';
import { registerServiceWorker } from './lib/push';
import { Shell } from './components/layout/Shell';
import { SignIn } from './views/auth/SignIn';
import { Snackbar } from './components/ui/Snackbar';
import { TaskDrawer } from './components/task/TaskDrawer';
import { CaptureModal } from './components/capture/CaptureModal';
import { SnoozePicker } from './components/snooze/SnoozePicker';
import { FilePreviewModal } from './components/files/FilePreviewModal';

export function App() {
  const user = useStore(s => s.user);
  const theme = useStore(s => s.theme);
  useEffect(() => applyThemeClass(theme), [theme]);
  useEffect(() => { void startSync(); void registerServiceWorker(); }, []);
  // Deep link from a notification: ?view=review
  useEffect(() => {
    const u = new URL(location.href);
    const v = u.searchParams.get('view');
    if (v === 'board' || v === 'review' || v === 'digest' || v === 'calendar' || v === 'archive' || v === 'stats' || v === 'search' || v === 'due' || v === 'recurring' || v === 'tags' || v === 'templates' || v === 'history') {
      useStore.getState().set({ view: v });
      u.searchParams.delete('view');
      history.replaceState(null, '', u.pathname + (u.search || '') + u.hash);
    }
  }, []);
  // Return from the Google Calendar consent screen: ?calendar=connected|denied|error
  useEffect(() => {
    const u = new URL(location.href);
    const r = u.searchParams.get('calendar');
    if (!r) return;
    u.searchParams.delete('calendar');
    history.replaceState(null, '', u.pathname + (u.search || '') + u.hash);
    const s = useStore.getState();
    const T = dict(s.lang);
    s.set({ view: 'calendar' });
    s.toast(r === 'connected' ? T.gcalConnected : r === 'denied' ? T.gcalDenied : T.gcalError);
  }, []);
  useEffect(() => {
    const onVis = () => { if (document.visibilityState === 'visible') void refreshSettings(); };
    document.addEventListener('visibilitychange', onVis);
    const id = setInterval(() => void refreshSettings(), 15 * 60_000);
    return () => { document.removeEventListener('visibilitychange', onVis); clearInterval(id); };
  }, []);
  return (
    <div className="relative h-full overflow-hidden font-sans text-13 text-ink">
      <Shell />
      <TaskDrawer />
      <CaptureModal />
      <SnoozePicker />
      <FilePreviewModal />
      {!user && <SignIn />}
      <Snackbar />
    </div>
  );
}
