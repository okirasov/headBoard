import { createApi, ApiError } from './api';

describe('createApi', () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  beforeEach(() => {
    calls.length = 0;
    globalThis.fetch = (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      if (url.endsWith('/ai/extract')) return new Response(JSON.stringify({ error: 'ai_unavailable' }), { status: 503 });
      if (init.method === 'DELETE') return new Response(null, { status: 204 });
      return new Response(JSON.stringify([{ id: 't1' }]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }) as typeof fetch;
  });
  it('adds bearer token and JSON body', async () => {
    const api = createApi('http://x/', () => 'tok');
    const r = await api.tasks.patch('a b', { title: 'x' });
    expect(r).toEqual([{ id: 't1' }]);
    expect(calls[0].url).toBe('http://x/tasks/a%20b');
    expect((calls[0].init.headers as Record<string, string>).Authorization).toBe('Bearer tok');
    expect(calls[0].init.body).toBe('{"title":"x"}');
  });
  it('maps error bodies to ApiError codes and handles 204', async () => {
    const api = createApi('http://x', () => null);
    await expect(api.ai.extract('t', [])).rejects.toMatchObject({ status: 503, code: 'ai_unavailable' });
    await expect(api.ai.extract('t', [])).rejects.toBeInstanceOf(ApiError);
    await expect(api.tasks.remove('z')).resolves.toBeUndefined();
  });
});
