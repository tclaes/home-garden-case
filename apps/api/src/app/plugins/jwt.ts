import fastifyJwt from '@fastify/jwt';
import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { userId: number; emailAddress: string };
    user: { userId: number; emailAddress: string };
  }
}

/**
 * Registers JWT signing/verification, used to authenticate requests once a user has logged in.
 */
export default fp(async function (fastify: FastifyInstance) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    fastify.log.warn(
      'JWT_SECRET is not set — falling back to an insecure development secret. Set JWT_SECRET in production.',
    );
  }

  fastify.register(fastifyJwt, {
    secret: secret ?? 'dev-insecure-secret-change-me',
  });
});
