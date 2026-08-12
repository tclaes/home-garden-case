const BASE_BACKOFF_MS = 200;
const MAX_BACKOFF_MS = 2000;

/**
 * Exponential backoff with full jitter (0-50% of the exponential delay added on top),
 * so concurrent retries after a transient outage don't all land on the same tick.
 */
export function backoffDelayMs(attempt: number, random: () => number = Math.random): number {
  const exponential = Math.min(BASE_BACKOFF_MS * 2 ** attempt, MAX_BACKOFF_MS);
  const jitter = random() * exponential * 0.5;
  return Math.round(exponential + jitter);
}
