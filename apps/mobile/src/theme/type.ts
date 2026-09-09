import type { TextStyle } from 'react-native';

export type Weight = 400 | 500 | 600;
const SANS: Record<Weight, string> = { 400: 'GolosText_400Regular', 500: 'GolosText_500Medium', 600: 'GolosText_600SemiBold' };
const MONO: Record<Weight, string> = { 400: 'IBMPlexMono_400Regular', 500: 'IBMPlexMono_500Medium', 600: 'IBMPlexMono_600SemiBold' };

export interface TxtOpts { w?: Weight; mono?: boolean; color?: string; ls?: number; lh?: number; upper?: boolean; italic?: boolean }

/** Text style helper: sans/mono family by weight, size, optional letter-spacing/line-height. */
export function txt(size: number, o: TxtOpts = {}): TextStyle {
  const w = o.w ?? 400;
  return {
    fontFamily: o.mono ? MONO[w] : SANS[w],
    fontSize: size,
    ...(o.color ? { color: o.color } : {}),
    ...(o.ls !== undefined ? { letterSpacing: o.ls } : {}),
    ...(o.lh !== undefined ? { lineHeight: Math.round(size * o.lh) } : {}),
    ...(o.upper ? { textTransform: 'uppercase' as const } : {}),
    ...(o.italic ? { fontStyle: 'italic' as const } : {}),
  };
}
/** Mono uppercase kicker at `size` with letter-spacing in em. */
export function kicker(size: number, color: string, em = 0.08): TextStyle {
  return txt(size, { mono: true, color, upper: true, ls: size * em });
}
