/** Design tokens (README table + 4 extras). Web mirrors these as CSS variables; mobile reads them directly. */
export const LIGHT = {
  bg: '#F4F1EA', panel: '#FAF8F3', card: '#FFFFFF', inset: '#F1EEE7', sel: '#EAE6DD',
  chipBg: '#EAE6DD', chipInk: '#1F1B18',
  ink: '#1F1B18', inkHov: '#3A342E', onInk: '#FBF9F4',
  mut: '#625C54', mut2: '#8B857B', faint: '#ABA59A', ghost: '#CDC7BC',
  line: '#E7E2D9', lineStrong: '#D4CEC2',
  acc: '#C8552F', accHov: '#A84325', hi: '#C8552F', onAcc: '#FFF3EC',
  med: '#E0B85A', goldInk: '#8F6A1A', goldBd: '#E0D6C2', goldFaint: '#A9895A',
  heat1: '#F6F2EA', heat2: '#F1E9DA', heat2b: '#F3E6CF', heat2bd: '#E3D2AE',
  rowLine: '#EEE9E0', rowLineGold: '#EFE6D2',
  ok: '#4F7A5C', okBg: '#E8F0E8', okBd: '#CFDFD0',
  tabBg: 'rgba(255,253,248,0.97)',
  scrim: 'rgba(32,29,23,0.55)', scrimSoft: 'rgba(32,29,23,0.32)',
  wait: '#9A7B2D', okHov: '#516F4A', fabShadow: 'rgba(188,86,54,0.4)', scrimDrawer: 'rgba(32,29,23,0.28)',
};
export type Tokens = typeof LIGHT;
export const DARK: Tokens = {
  bg: '#161412', panel: '#1C1A18', card: '#232019', inset: '#2B2824', sel: '#34302B',
  chipBg: '#34302B', chipInk: '#F3EFE9',
  ink: '#F3EFE9', inkHov: '#FFFFFF', onInk: '#161412',
  mut: '#CDC6BC', mut2: '#9E978C', faint: '#736D64', ghost: '#4B4740',
  line: '#2E2B27', lineStrong: '#413D37',
  acc: '#E8724A', accHov: '#F0855F', hi: '#E8724A', onAcc: '#FFF6F0',
  med: '#D9B25C', goldInk: '#DDB868', goldBd: '#4A4230', goldFaint: '#A88C55',
  heat1: '#211E1A', heat2: '#2B261E', heat2b: '#3A3224', heat2bd: '#57492E',
  rowLine: '#2B2824', rowLineGold: '#3A3224',
  ok: '#8FC08F', okBg: '#222A22', okBd: '#354535',
  tabBg: 'rgba(35,32,29,0.97)',
  scrim: 'rgba(0,0,0,0.62)', scrimSoft: 'rgba(0,0,0,0.5)',
  wait: '#9A7B2D', okHov: '#516F4A', fabShadow: 'rgba(188,86,54,0.4)', scrimDrawer: 'rgba(32,29,23,0.28)',
};
export type TokenName = keyof Tokens;
/** Resolve a project colour that may be written as `var(--acc)` (web data) into a concrete colour. */
export function resolveColor(c: string, t: Tokens): string {
  const m = /^var\(--([a-zA-Z0-9]+)\)$/.exec(c.trim());
  return m && m[1] in t ? t[m[1] as TokenName] : c;
}
