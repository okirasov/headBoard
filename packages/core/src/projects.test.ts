import { PROJECT_PALETTE, newProject, nextProjectColor } from './projects';

describe('projects', () => {
  it('newProject trims and caps the name', () => {
    const p = newProject('   Writing   ', '#000', 1);
    expect(p.name).toBe('Writing');
    expect(p.id.startsWith('p1')).toBe(true);
    expect(newProject('x'.repeat(80), '#000').name.length).toBe(60);
  });
  it('nextProjectColor skips used swatches', () => {
    expect(nextProjectColor([])).toBe(PROJECT_PALETTE[0].color);
    expect(nextProjectColor([{ id: 'a', name: 'a', color: PROJECT_PALETTE[0].color }])).toBe(PROJECT_PALETTE[1].color);
    const all = PROJECT_PALETTE.map((s, i) => ({ id: String(i), name: 'p', color: s.color }));
    expect(nextProjectColor(all)).toBe(PROJECT_PALETTE[0].color);
  });
});
