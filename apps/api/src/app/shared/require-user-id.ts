import { FastifyRequest } from 'fastify';
import { userIdParamsSchema } from '@itp-home-garden/shared-api-contracts';
import { UnauthorizedError } from './errors';

declare module 'fastify' {
  interface FastifyRequest {
    userId: number;
  }
}

const USER_ID_HEADER = 'x-user-id';

/**
 * Reads the trusted X-User-Id header set by the Next.js server (derived from the session
 * cookie) — mirrors the existing, equally-unverified Authorization bearer token pattern.
 */
export function requireUserId(request: FastifyRequest): number {
  const raw = request.headers[USER_ID_HEADER];
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parsed = userIdParamsSchema.shape.userId.safeParse(value);
  if (!parsed.success) {
    throw new UnauthorizedError('Missing or invalid X-User-Id header');
  }
  return parsed.data;
}
