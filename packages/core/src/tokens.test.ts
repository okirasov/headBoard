import { LIGHT, DARK, resolveColor } from './tokens';
describe('tokens', () => {
  it('light and dark have the same names', () => {
    expect(Object.keys(DARK).sort()).toEqual(Object.keys(LIGHT).sort());
  });
  it('resolveColor maps var() to token values', () => {
    expect(resolveColor('var(--acc)', LIGHT)).toBe('#C8552F');
    expect(resolveColor('#6B7FA3', LIGHT)).toBe('#6B7FA3');
  });
});
