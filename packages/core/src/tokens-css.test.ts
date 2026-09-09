import { readFileSync } from 'node:fs';
import { LIGHT, DARK } from './tokens';

function parse(block: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of block.matchAll(/--([a-zA-Z0-9]+):\s*([^;]+);/g)) out[m[1]] = m[2].replace(/\s+/g, '');
  return out;
}
describe('web tokens.css mirrors core tokens', () => {
  const css = readFileSync(new URL('../../../apps/web/src/styles/tokens.css', import.meta.url), 'utf8');
  const [lightBlock, darkBlock] = css.split('.dark');
  it.each([['light', lightBlock, LIGHT], ['dark', darkBlock, DARK]] as const)('%s', (_n, block, ref) => {
    const got = parse(block);
    for (const [k, v] of Object.entries(ref)) expect(got[k]).toBe(v.replace(/\s+/g, ''));
  });
});
