import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiRequest, apiRequestAll } from './api';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('apiRequest', () => {
  it('sends JSON requests with the authentication token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiRequest('/users/', {
      method: 'POST',
      token: 'test-token',
      body: JSON.stringify({ username: 'student' }),
    })).resolves.toEqual({ ok: true });

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers.get('Authorization')).toBe('Token test-token');
    expect(options.headers.get('Content-Type')).toBe('application/json');
  });

  it('surfaces API errors with the server message and status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: 'Invalid credentials.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    ));

    await expect(apiRequest('/users/login/')).rejects.toMatchObject({
      message: 'Invalid credentials.',
      status: 401,
    });
  });

  it('reports network failures instead of returning a success-shaped value', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    await expect(apiRequest('/services/')).rejects.toThrow(
      'Could not reach the FixIt API.',
    );
  });
});

describe('apiRequestAll', () => {
  it('collects results across all API pages', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        results: [{ id: 1 }],
        next: 'http://127.0.0.1:8000/api/items/?page=2',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        results: [{ id: 2 }],
        next: null,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiRequestAll('/items/')).resolves.toEqual([
      { id: 1 },
      { id: 2 },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toBe(
      'http://127.0.0.1:8000/api/items/?page=2',
    );
  });

  it('rejects malformed paginated responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ results: 'not-an-array' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    ));

    await expect(apiRequestAll('/items/')).rejects.toThrow(
      'The API returned an unexpected paginated response.',
    );
  });
});
