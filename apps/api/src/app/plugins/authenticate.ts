import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { UnauthorizedError } from '../shared/errors';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

/**
 * Decorates the fastify instance with an `authenticate` preHandler that routes opt into to
 * require a valid bearer JWT, decorating `request.user` on success.
 *
 * Throws rather than replying directly: `reply.sent` only flips once the response has actually
 * finished writing to the socket, which — combined with this app's `slow-api` plugin injecting a
 * 0.2-2s delay into every `onSend` — means a manually-sent reply here wouldn't reliably stop
 * Fastify from also invoking the route handler. Throwing routes through the same guaranteed
 * error path (and the existing `UnauthorizedError` -> 401 mapping in error-handler.ts) that the
 * rest of the app already uses.
 */
export default fp(async function (fastify: FastifyInstance) {
  fastify.decorate('authenticate', async (request: FastifyRequest, _reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch {
      throw new UnauthorizedError('Missing or invalid authentication token');
    }
  });
});
