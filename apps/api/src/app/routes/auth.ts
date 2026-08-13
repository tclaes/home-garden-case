import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod/v4';
import {
  authResponseSchema,
  conflictErrorResponseSchema,
  internalServerErrorResponseSchema,
  loginSchema,
  notFoundErrorResponseSchema,
  registerSchema,
  unauthorizedErrorResponseSchema,
  userResponseSchema,
  validationErrorResponseSchema,
} from '@itp-home-garden/shared-api-contracts';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';

export default async function (fastify: FastifyInstance) {
  const authService = fastify.diContainer.resolve<AuthService>('authService');
  const userService = fastify.diContainer.resolve<UserService>('userService');

  /**
   * POST /auth/register
   * Register a new user and return a session token
   */
  fastify.withTypeProvider<ZodTypeProvider>().post<{
    Body: z.infer<typeof registerSchema>;
  }>(
    '/auth/register',
    {
      schema: {
        description: 'Register a new user',
        tags: ['auth'],
        body: registerSchema,
        response: {
          201: authResponseSchema,
          400: validationErrorResponseSchema,
          409: conflictErrorResponseSchema,
          500: internalServerErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const user = await authService.register(request.body);
      const token = fastify.jwt.sign(
        { userId: user.userId, emailAddress: user.emailAddress },
        { expiresIn: '7d' },
      );
      return reply.status(201).send({ token, user });
    },
  );

  /**
   * POST /auth/login
   * Verify credentials and return a session token
   */
  fastify.withTypeProvider<ZodTypeProvider>().post<{
    Body: z.infer<typeof loginSchema>;
  }>(
    '/auth/login',
    {
      schema: {
        description: 'Log in with email and password',
        tags: ['auth'],
        body: loginSchema,
        response: {
          200: authResponseSchema,
          400: validationErrorResponseSchema,
          401: unauthorizedErrorResponseSchema,
          500: internalServerErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const user = await authService.login(request.body);
      const token = fastify.jwt.sign(
        { userId: user.userId, emailAddress: user.emailAddress },
        { expiresIn: '7d' },
      );
      return reply.send({ token, user });
    },
  );

  /**
   * GET /auth/me
   * Return the currently authenticated user
   */
  fastify.withTypeProvider<ZodTypeProvider>().get(
    '/auth/me',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Get the currently authenticated user',
        tags: ['auth'],
        response: {
          200: userResponseSchema,
          401: unauthorizedErrorResponseSchema,
          404: notFoundErrorResponseSchema,
          500: internalServerErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const user = await userService.getUserById(request.user.userId);
      return reply.send(user);
    },
  );
}
