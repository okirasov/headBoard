import type { Project } from './model';

/**
 * Swatches offered when creating or recolouring a project. Project colours are user data, not design tokens;
 * the two `var(--…)` entries follow the theme, the rest are fixed hues that read well on both palettes.
 */
export const PROJECT_PALETTE: ReadonlyArray<{ key: string; color: string }> = [
  { key: 'terracotta', color: 'var(--acc)' },
  { key: 'sage', color: 'var(--ok)' },
  { key: 'ochre', color: '#9A7B2D' },
  { key: 'slate', color: '#6B7FA3' },
  { key: 'plum', color: '#97658C' },
  { key: 'teal', color: '#4F8A8B' },
  { key: 'rose', color: '#B25E7E' },
  { key: 'graphite', color: '#7A8291' },
];

export function newProject(name: string, color: string, now = Date.now()): Project {
  return { id: 'p' + now + Math.random().toString(36).slice(2, 6), name: name.trim().slice(0, 60), color };
}

/** Next unused palette colour (falls back to the first). */
export function nextProjectColor(projects: Project[]): string {
  const used = new Set(projects.map(p => p.color));
  return PROJECT_PALETTE.find(s => !used.has(s.color))?.color ?? PROJECT_PALETTE[0].color;
}
