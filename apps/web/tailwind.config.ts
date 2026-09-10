import type { Config } from 'tailwindcss';

// Every colour is a design token exposed as a CSS variable (see src/styles/tokens.css).
const TOKENS = [
  'bg', 'panel', 'card', 'inset', 'sel', 'chipBg', 'chipInk', 'ink', 'inkHov', 'onInk', 'mut', 'mut2', 'faint', 'ghost',
  'line', 'lineStrong', 'acc', 'accHov', 'hi', 'onAcc', 'med', 'goldInk', 'goldBd', 'goldFaint', 'heat1', 'heat2', 'heat2b',
  'heat2bd', 'rowLine', 'rowLineGold', 'ok', 'okBg', 'okBd', 'okHov', 'wait', 'tabBg', 'scrim', 'scrimSoft', 'scrimDrawer',
] as const;

const colors = Object.fromEntries(TOKENS.map(t => [t, `var(--${t})`]));

const px = (...ns: number[]) => Object.fromEntries(ns.map(n => [String(n), `${n}px`]));

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    colors: { ...colors, transparent: 'transparent', current: 'currentColor' },
    fontFamily: {
      sans: ['"Golos Text"', 'system-ui', 'sans-serif'],
      mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
    },
    fontSize: px(8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 14.5, 15, 16, 17, 18, 19, 20, 21, 22, 26, 28),
    borderRadius: { none: '0', ...px(2, 6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 20, 22), full: '9999px' },
    // px-based spacing: p-12 = 12px, w-234 = 234px
    spacing: { px: '1px', ...px(...Array.from({ length: 65 }, (_, i) => i)), ...px(0.5, 1.5, 2.5, 4.5, 72, 80, 90, 96, 110, 120, 130, 132, 150, 186, 200, 234, 250, 280, 290, 300, 322, 380, 392, 432, 460, 470, 520, 600, 720, 730, 760, 820, 1080) },
    borderWidth: { DEFAULT: '1px', 0: '0', 1: '1px', 1.5: '1.5px', 2: '2px', 4: '4px', 5: '5px' },
    extend: {
      boxShadow: {
        'card-hover': '0 6px 16px rgba(32,29,23,0.09)',
        modal: '0 32px 80px rgba(32,29,23,0.3)',
        'modal-strong': '0 32px 80px rgba(32,29,23,0.42)',
        auth: '0 32px 80px rgba(32,29,23,0.16)',
        drawer: '-24px 0 48px rgba(32,29,23,0.14)',
        menu: '0 18px 44px rgba(32,29,23,0.18)',
        snack: '0 12px 32px rgba(32,29,23,0.3)',
        snooze: '0 24px 64px rgba(32,29,23,0.3)',
        fab: '0 10px 24px var(--fabShadow)',
        'pr-ring': 'inset 0 0 0 1px rgba(32,29,23,0.10)',
        'pr-ring-sel': 'inset 0 0 0 2px var(--panel)',
      },
      keyframes: {
        fadeUp: { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideIn: { from: { opacity: '0', transform: 'translateX(24px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        sheetUp: { from: { opacity: '0', transform: 'translateY(40px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulse: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '.3' } },
      },
      animation: {
        fadeUp: 'fadeUp .2s ease',
        fadeUpFast: 'fadeUp .18s ease',
        fadeUpSlow: 'fadeUp .22s ease',
        slideIn: 'slideIn .22s ease',
        sheetUp: 'sheetUp .24s ease',
        pulse: 'pulse 2.4s ease-in-out infinite',
      },
      letterSpacing: { kicker: '.08em', kickerWide: '.1em', tight: '-.3px', tightSm: '-.2px', tightXs: '-.1px' },
    },
  },
  plugins: [],
} satisfies Config;
