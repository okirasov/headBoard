import { createContext, useContext, type ReactNode } from 'react';
import { DARK, LIGHT, type Tokens, type Theme } from '@headboard/core';
import { useStore } from '../store/useStore';

const Ctx = createContext<{ t: Tokens; theme: Theme }>({ t: LIGHT, theme: 'light' });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useStore(s => s.theme);
  return <Ctx.Provider value={{ t: theme === 'dark' ? DARK : LIGHT, theme }}>{children}</Ctx.Provider>;
}
export function useTheme() {
  return useContext(Ctx);
}
