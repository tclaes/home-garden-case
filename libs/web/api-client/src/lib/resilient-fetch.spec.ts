import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod/v4';
import { ApiTimeoutError } from './errors.js';
import { resilientFetch } from './resilient-fetch.js';

const schema = z.object({ ok: z.boolean() });

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('resilientFetch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('parses and returns a successful response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ ok: true })));

    await expect(resilientFetch('http://x/test', schema)).resolves.toEqual({ ok: true });
  });

  it('treats a 204 response as null', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));

    await expect(resilientFetch('http://x/test', z.null())).resolves.toBeNull();
  });

  it('treats a 205 response as null', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 205 })));

    await expect(resilientFetch('http://x/test', z.null())).resolves.toBeNull();
  });

  it('does not retry a response that fails schema validation', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: 'not-a-boolean' }, 200));
    vi.stubGlobal('fetch', fetchMock);

    await expect(resilientFetch('http://x/test', schema, { retries: 1 })).rejects.toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('throws immediately on a non-retryable 4xx, without retrying', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ error: 'not found' }, 404));
    vi.stubGlobal('fetch', fetchMock);

    await expect(resilientFetch('http://x/test', schema, { retries: 3 })).rejects.toMatchObject({
      status: 404,
      message: 'not found',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries a 500 and succeeds on the next attempt', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: 'boom' }, 500))
      .mockResolvedValueOnce(jsonResponse({ ok: true }, 200));
    vi.stubGlobal('fetch', fetchMock);

    const promise = resilientFetch('http://x/test', schema, { retries: 2 });
    await vi.runAllTimersAsync();

    await expect(promise).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('gives up after exhausting retries on repeated 500s', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ error: 'boom' }, 500));
    vi.stubGlobal('fetch', fetchMock);

    const promise = resilientFetch('http://x/test', schema, { retries: 2 });
    const assertion = expect(promise).rejects.toMatchObject({ status: 500 });
    await vi.runAllTimersAsync();
    await assertion;

    expect(fetchMock).toHaveBeenCalledTimes(3); // initial attempt + 2 retries
  });

  it('does not retry when retries is 0 (the default for non-idempotent writes)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ error: 'boom' }, 500));
    vi.stubGlobal('fetch', fetchMock);

    await expect(resilientFetch('http://x/test', schema)).rejects.toMatchObject({ status: 500 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries on a network error and eventually succeeds', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('network error'))
      .mockResolvedValueOnce(jsonResponse({ ok: true }, 200));
    vi.stubGlobal('fetch', fetchMock);

    const promise = resilientFetch('http://x/test', schema, { retries: 1 });
    await vi.runAllTimersAsync();

    await expect(promise).resolves.toEqual({ ok: true });
  });

  it('times out and throws ApiTimeoutError when the request hangs', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener('abort', () => {
              reject(new DOMException('Aborted', 'AbortError'));
            });
          }),
      ),
    );

    const promise = resilientFetch('http://x/test', schema, { timeoutMs: 1000 });
    const assertion = expect(promise).rejects.toBeInstanceOf(ApiTimeoutError);
    await vi.runAllTimersAsync();
    await assertion;
  });
});
