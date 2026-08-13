import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod/v4';
import {
  internalServerErrorResponseSchema,
  notFoundErrorResponseSchema,
  unauthorizedErrorResponseSchema,
  validationErrorResponseSchema,
  gardenIdParamsSchema,
  emptyResponseSchema,
  createPlantSchema,
  plantIdParamsSchema,
  plantResponseSchema,
  plantsResponseSchema,
  updatePlantSchema,
} from '@itp-home-garden/shared-api-contracts';
import { PlantService } from '../services/plant.service';
import { requireUserId } from '../shared/require-user-id';

export default async function (fastify: FastifyInstance) {
  const plantService = fastify.diContainer.resolve<PlantService>('plantService');

  fastify.addHook('onRequest', async (request) => {
    request.userId = requireUserId(request);
  });

  /**
   * GET /plants/:plantId
   * Get a plant by ID
   */
  fastify.withTypeProvider<ZodTypeProvider>().get<{ Params: z.infer<typeof plantIdParamsSchema> }>(
    '/plants/:plantId',
    {
      schema: {
        description: 'Get a plant by ID',
        tags: ['plants'],
        params: plantIdParamsSchema,
        response: {
          200: plantResponseSchema,
          400: validationErrorResponseSchema,
          401: unauthorizedErrorResponseSchema,
          404: notFoundErrorResponseSchema,
          500: internalServerErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const plant = await plantService.getPlantById(request.params.plantId, request.userId);
      return reply.send(plant);
    },
  );

  /**
   * GET /plants/garden/:gardenId
   * Get all plants in a specific garden
   */
  fastify.withTypeProvider<ZodTypeProvider>().get<{ Params: z.infer<typeof gardenIdParamsSchema> }>(
    '/plants/garden/:gardenId',
    {
      schema: {
        description: 'Get all plants in a specific garden',
        tags: ['plants'],
        params: gardenIdParamsSchema,
        response: {
          200: plantsResponseSchema,
          400: validationErrorResponseSchema,
          401: unauthorizedErrorResponseSchema,
          404: notFoundErrorResponseSchema,
          500: internalServerErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const plants = await plantService.getPlantsByGardenId(
        request.params.gardenId,
        request.userId,
      );
      return reply.send(plants);
    },
  );

  /**
   * POST /plants
   * Create a new plant
   */
  fastify.withTypeProvider<ZodTypeProvider>().post<{
    Body: z.infer<typeof createPlantSchema>;
  }>(
    '/plants',
    {
      schema: {
        description: 'Create a new plant',
        tags: ['plants'],
        body: createPlantSchema,
        response: {
          201: plantResponseSchema,
          400: validationErrorResponseSchema,
          401: unauthorizedErrorResponseSchema,
          404: notFoundErrorResponseSchema,
          500: internalServerErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const plant = await plantService.createPlant(request.body, request.userId);
      return reply.status(201).send(plant);
    },
  );

  /**
   * PUT /plants/:plantId
   * Update a plant
   */
  fastify.withTypeProvider<ZodTypeProvider>().put<{
    Params: z.infer<typeof plantIdParamsSchema>;
    Body: z.infer<typeof updatePlantSchema>;
  }>(
    '/plants/:plantId',
    {
      schema: {
        description: 'Update a plant',
        tags: ['plants'],
        params: plantIdParamsSchema,
        body: updatePlantSchema,
        response: {
          200: plantResponseSchema,
          400: validationErrorResponseSchema,
          401: unauthorizedErrorResponseSchema,
          404: notFoundErrorResponseSchema,
          500: internalServerErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const plant = await plantService.updatePlant(
        request.params.plantId,
        request.body,
        request.userId,
      );
      return reply.send(plant);
    },
  );

  /**
   * DELETE /plants/:plantId
   * Delete a plant
   */
  fastify
    .withTypeProvider<ZodTypeProvider>()
    .delete<{ Params: z.infer<typeof plantIdParamsSchema> }>(
      '/plants/:plantId',
      {
        schema: {
          description: 'Delete a plant',
          tags: ['plants'],
          params: plantIdParamsSchema,
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
        await plantService.deletePlant(request.params.plantId, request.userId);
        return reply.status(204).send();
      },
    );
}
