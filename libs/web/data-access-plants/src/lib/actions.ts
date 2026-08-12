'use server';

import {
  createPlantSchema,
  updatePlantSchema,
  emptyResponseSchema,
  plantResponseSchema,
  type Plant,
  type CreatePlantInput,
  type UpdatePlantInput,
} from '@itp-home-garden/shared-api-contracts';
import { ApiError, apiUrl, authHeaders, resilientFetch } from '@itp-home-garden/web-api-client';
import { gardenTag } from '@itp-home-garden/web-data-access-gardens';
import { revalidateTag } from 'next/cache';
import { plantsForGardenTag, plantTag } from './cache-tags.js';

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

function toActionError(error: unknown, fallback: string): { ok: false; error: string } {
  if (error instanceof ApiError) {
    return { ok: false, error: error.message };
  }
  return { ok: false, error: fallback };
}

/**
 * Not retried automatically (POST is not idempotent). The overcrowding rule is enforced
 * server-side, so a validation failure here surfaces as a normal ApiError with the backend's
 * message, not a thrown exception — the form renders it inline.
 */
export async function createPlantAction(input: CreatePlantInput): Promise<ActionResult<Plant>> {
  const parsed = createPlantSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid plant data' };
  }

  try {
    const plant = await resilientFetch(apiUrl('/plants'), plantResponseSchema, {
      method: 'POST',
      headers: authHeaders(),
      body: parsed.data,
      retries: 0,
    });
    revalidateTag(plantsForGardenTag(plant.gardenId));
    revalidateTag(gardenTag(plant.gardenId));
    return { ok: true, data: plant };
  } catch (error) {
    return toActionError(error, 'Could not add the plant. Please try again.');
  }
}

/** PUT is idempotent, so retries are safe. `previousGardenId` lets us invalidate the old garden's
 * plant list too, in case the plant was moved to a different garden. */
export async function updatePlantAction(
  plantId: number,
  previousGardenId: number,
  input: UpdatePlantInput,
): Promise<ActionResult<Plant>> {
  const parsed = updatePlantSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid plant data' };
  }

  try {
    const plant = await resilientFetch(apiUrl(`/plants/${plantId}`), plantResponseSchema, {
      method: 'PUT',
      headers: authHeaders(),
      body: parsed.data,
      retries: 2,
    });
    revalidateTag(plantTag(plantId));
    revalidateTag(plantsForGardenTag(previousGardenId));
    revalidateTag(gardenTag(previousGardenId));
    if (plant.gardenId !== previousGardenId) {
      revalidateTag(plantsForGardenTag(plant.gardenId));
      revalidateTag(gardenTag(plant.gardenId));
    }
    return { ok: true, data: plant };
  } catch (error) {
    return toActionError(error, 'Could not update the plant. Please try again.');
  }
}

/**
 * DELETE is idempotent, so retries are safe. A 404 means either the resource never existed, or a
 * retry landed after an earlier attempt's response was lost but had already committed on the
 * server — either way the desired end state (resource gone) holds, so we treat it as success.
 */
export async function deletePlantAction(
  plantId: number,
  gardenId: number,
): Promise<ActionResult<null>> {
  try {
    await resilientFetch(apiUrl(`/plants/${plantId}`), emptyResponseSchema, {
      method: 'DELETE',
      headers: authHeaders(),
      retries: 2,
    });
    revalidateTag(plantTag(plantId));
    revalidateTag(plantsForGardenTag(gardenId));
    revalidateTag(gardenTag(gardenId));
    return { ok: true, data: null };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      revalidateTag(plantTag(plantId));
      revalidateTag(plantsForGardenTag(gardenId));
      revalidateTag(gardenTag(gardenId));
      return { ok: true, data: null };
    }
    return toActionError(error, 'Could not delete the plant. Please try again.');
  }
}
