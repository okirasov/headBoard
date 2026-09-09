import { useEffect } from 'react';
import { useStore, applyThemeClass } from './store/useStore';
import { startSync, refreshSettings } from './store/sync';
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
  useEffect(() => { void startSync(); }, []);
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
