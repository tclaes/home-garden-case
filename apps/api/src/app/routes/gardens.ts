import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod/v4';
import {
  internalServerErrorResponseSchema,
  notFoundErrorResponseSchema,
  unauthorizedErrorResponseSchema,
  validationErrorResponseSchema,
  createGardenSchema,
  gardenIdParamsSchema,
  gardenResponseSchema,
  gardensResponseSchema,
  updateGardenSchema,
  emptyResponseSchema,
} from '@itp-home-garden/shared-api-contracts';
import { GardenService } from '../services/garden.service';
import { requireUserId } from '../shared/require-user-id';

export default async function (fastify: FastifyInstance) {
  const gardenService = fastify.diContainer.resolve<GardenService>('gardenService');

  fastify.addHook('onRequest', async (request) => {
    request.userId = requireUserId(request);
  });

  /**
   * GET /gardens
   * Get all gardens
   */
  fastify.withTypeProvider<ZodTypeProvider>().get(
    '/gardens',
    {
      schema: {
        description: 'Get all gardens',
        tags: ['gardens'],
        response: {
          200: gardensResponseSchema,
          401: unauthorizedErrorResponseSchema,
          500: internalServerErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const gardens = await gardenService.getAllGardens(request.userId);
      return reply.send(gardens);
    },
  );

  /**
   * GET /gardens/:gardenId
   * Get a garden by ID
   */
  fastify.withTypeProvider<ZodTypeProvider>().get<{ Params: z.infer<typeof gardenIdParamsSchema> }>(
    '/gardens/:gardenId',
    {
      schema: {
        description: 'Get a garden by ID',
        tags: ['gardens'],
        params: gardenIdParamsSchema,
        response: {
          200: gardenResponseSchema,
          400: validationErrorResponseSchema,
          401: unauthorizedErrorResponseSchema,
          404: notFoundErrorResponseSchema,
          500: internalServerErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const garden = await gardenService.getGardenById(request.params.gardenId, request.userId);
      return reply.send(garden);
    },
  );

  /**
   * POST /gardens
   * Create a new garden
   */
  fastify.withTypeProvider<ZodTypeProvider>().post<{
    Body: z.infer<typeof createGardenSchema>;
  }>(
    '/gardens',
    {
      schema: {
        description: 'Create a new garden',
        tags: ['gardens'],
        body: createGardenSchema,
        response: {
          201: gardenResponseSchema,
          400: validationErrorResponseSchema,
          401: unauthorizedErrorResponseSchema,
          500: internalServerErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const garden = await gardenService.createGarden(request.body, request.userId);
      return reply.status(201).send(garden);
    },
  );

  /**
   * PUT /gardens/:gardenId
   * Update a garden
   */
  fastify.withTypeProvider<ZodTypeProvider>().put<{
    Params: z.infer<typeof gardenIdParamsSchema>;
    Body: z.infer<typeof updateGardenSchema>;
  }>(
    '/gardens/:gardenId',
    {
      schema: {
        description: 'Update a garden',
        tags: ['gardens'],
        params: gardenIdParamsSchema,
        body: updateGardenSchema,
        response: {
          200: gardenResponseSchema,
          400: validationErrorResponseSchema,
          401: unauthorizedErrorResponseSchema,
          404: notFoundErrorResponseSchema,
          500: internalServerErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const garden = await gardenService.updateGarden(
        request.params.gardenId,
        request.body,
        request.userId,
      );
      return reply.send(garden);
    },
  );

  /**
   * DELETE /gardens/:gardenId
   * Delete a garden
   */
  fastify
    .withTypeProvider<ZodTypeProvider>()
    .delete<{ Params: z.infer<typeof gardenIdParamsSchema> }>(
      '/gardens/:gardenId',
      {
        schema: {
          description: 'Delete a garden',
          tags: ['gardens'],
          params: gardenIdParamsSchema,
          response: {
            204: emptyResponseSchema,
            400: validationErrorResponseSchema,
            401: unauthorizedErrorResponseSchema,
            404: notFoundErrorResponseSchema,
            500: internalServerErrorResponseSchema,
          },
        },
      },
      async (request, reply) => {
        await gardenService.deleteGarden(request.params.gardenId, request.userId);
        return reply.status(204).send();
      },
    );
}
