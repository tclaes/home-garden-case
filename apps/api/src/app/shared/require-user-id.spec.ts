import { describe, expect, it } from 'vitest';
import { FastifyRequest } from 'fastify';
import { requireUserId } from './require-user-id';
import { UnauthorizedError } from './errors';

function requestWithHeaders(headers: Record<string, string | string[] | undefined>) {
  return { headers } as unknown as FastifyRequest;
}

describe('requireUserId', () => {
  it('throws UnauthorizedError when the header is missing', () => {
    expect(() => requireUserId(requestWithHeaders({}))).toThrow(UnauthorizedError);
  });

  it('throws UnauthorizedError when the header is not a positive integer', () => {
    expect(() => requireUserId(requestWithHeaders({ 'x-user-id': 'not-a-number' }))).toThrow(
      UnauthorizedError,
    );
    expect(() => requireUserId(requestWithHeaders({ 'x-user-id': '0' }))).toThrow(
      UnauthorizedError,
    );
    expect(() => requireUserId(requestWithHeaders({ 'x-user-id': '-1' }))).toThrow(
      UnauthorizedError,
    );
  });

  it('returns the parsed number for a valid header', () => {
    expect(requireUserId(requestWithHeaders({ 'x-user-id': '42' }))).toBe(42);
  });

  it('uses the first value when the header is sent multiple times', () => {
    expect(requireUserId(requestWithHeaders({ 'x-user-id': ['7', '9'] }))).toBe(7);
  });
});
