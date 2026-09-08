import { useEffect } from 'react';
import { useStore, applyThemeClass } from './store/useStore';
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
