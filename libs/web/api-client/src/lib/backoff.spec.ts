import { describe, expect, it } from 'vitest';
import { backoffDelayMs } from './backoff.js';

describe('backoffDelayMs', () => {
  it('grows exponentially with attempt number when jitter is 0', () => {
    expect(backoffDelayMs(0, () => 0)).toBe(200);
    expect(backoffDelayMs(1, () => 0)).toBe(400);
    expect(backoffDelayMs(2, () => 0)).toBe(800);
    expect(backoffDelayMs(3, () => 0)).toBe(1600);
  });

  it('caps the exponential delay at 2000ms', () => {
    expect(backoffDelayMs(10, () => 0)).toBe(2000);
  });

  it('adds up to 50% jitter on top of the exponential delay', () => {
    expect(backoffDelayMs(0, () => 1)).toBe(300); // 200 + 1 * 200 * 0.5
    expect(backoffDelayMs(2, () => 1)).toBe(1200); // 800 + 1 * 800 * 0.5
  });
});
