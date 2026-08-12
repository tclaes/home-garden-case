import { describe, expect, it } from 'vitest';
import { cn } from './cn.js';

describe('cn', () => {
  it('joins plain class strings', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('drops falsy values', () => {
    expect(cn('a', false, undefined, null, 'b')).toBe('a b');
  });

  it('resolves conflicting Tailwind utilities by keeping the last one', () => {
    // This is the whole reason to use tailwind-merge over plain clsx: a later className prop
    // (e.g. a consumer override) should win over an earlier conflicting utility, not just append.
    expect(cn('flex-col', 'flex-row')).toBe('flex-row');
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });
});
