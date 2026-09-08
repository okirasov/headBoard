import { useEffect } from 'react';
import { useStore, applyThemeClass } from './store/useStore';
import { Shell } from './components/layout/Shell';
import { SignIn } from './views/auth/SignIn';
import { Snackbar } from './components/ui/Snackbar';

export function App() {
  const user = useStore(s => s.user);
  const theme = useStore(s => s.theme);
  useEffect(() => applyThemeClass(theme), [theme]);
  return (
    <div className="relative h-full overflow-hidden font-sans text-13 text-ink">
      <Shell />
      {!user && <SignIn />}
      <Snackbar />
    </div>
  );
}
