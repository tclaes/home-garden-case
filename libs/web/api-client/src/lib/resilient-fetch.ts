import type { ZodType } from 'zod/v4';
import { backoffDelayMs } from './backoff.js';
import { ApiError, ApiTimeoutError } from './errors.js';

export interface NextFetchOptions {
  tags?: string[];
  revalidate?: number | false;
}

export interface ResilientFetchOptions {
  method?: string;
  headers?: Record<string, string>;
  /** JSON-serializable request body. */
  body?: unknown;
  timeoutMs?: number;
  /** Number of retry attempts on top of the initial try. Callers decide this per call — reads can
   * retry freely, non-idempotent writes should generally pass 0 and let the user retry explicitly. */
  retries?: number;
  retryableStatusCodes?: readonly number[];
  cache?: 'default' | 'no-store' | 'reload' | 'no-cache' | 'force-cache' | 'only-if-cached';
  /** Next.js fetch cache extension (tags for `revalidateTag`, ISR-style revalidate window). */
  next?: NextFetchOptions;
}

const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_RETRIES = 0;
const DEFAULT_RETRYABLE_STATUS_CODES = [500, 502, 503, 504] as const;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchOnce(
  url: string,
  options: ResilientFetchOptions,
  serializedBody: string | undefined,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      method: options.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: serializedBody,
      signal: controller.signal,
      cache: options.cache,
      ...(options.next ? { next: options.next } : {}),
    } as RequestInit);
  } catch (error) {
    if (controller.signal.aborted) {
      throw new ApiTimeoutError(url, timeoutMs);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function parseErrorBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

/**
 * Sends the request and retries on network failures or configured retryable status codes.
 * Deterministic failures (invalid response body, schema mismatch) are handled by the caller,
 * outside of this retry loop, since retrying them can't change the outcome.
 */
async function fetchWithRetry(
  url: string,
  options: ResilientFetchOptions,
  serializedBody: string | undefined,
  timeoutMs: number,
  retries: number,
  retryableStatusCodes: readonly number[],
): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const attemptsRemain = attempt < retries;

    let response: Response;
    try {
      response = await fetchOnce(url, options, serializedBody, timeoutMs);
    } catch (error) {
      if (attemptsRemain) {
        await sleep(backoffDelayMs(attempt));
        continue;
      }
      throw error;
    }

    if (!response.ok && retryableStatusCodes.includes(response.status) && attemptsRemain) {
      await sleep(backoffDelayMs(attempt));
      continue;
    }

    return response;
  }
}

/**
 * A generic, domain-agnostic fetch wrapper: timeout via AbortSignal, retry with exponential
 * backoff + jitter on 5xx/network failures, and zod validation of the response body.
 *
 * Deliberately knows nothing about gardens or plants — that policy (which calls may retry,
 * which cache tags to set) lives in the data-access layer that calls this.
 */
export async function resilientFetch<T>(
  url: string,
  schema: ZodType<T>,
  options: ResilientFetchOptions = {},
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = options.retries ?? DEFAULT_RETRIES;
  const retryableStatusCodes = options.retryableStatusCodes ?? DEFAULT_RETRYABLE_STATUS_CODES;
  const serializedBody = options.body !== undefined ? JSON.stringify(options.body) : undefined;

  const response = await fetchWithRetry(
    url,
    options,
    serializedBody,
    timeoutMs,
    retries,
    retryableStatusCodes,
  );

  if (!response.ok) {
    const details = await parseErrorBody(response);
    const message =
      details && typeof details === 'object' && 'error' in details
        ? String((details as { error: unknown }).error)
        : `Request to ${url} failed with status ${response.status}`;
    throw new ApiError(message, response.status, details);
  }

  if (response.status === 204 || response.status === 205) {
    return schema.parse(null);
  }

  return schema.parse(await response.json());
}
