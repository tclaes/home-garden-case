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
import { userHeaders } from '@itp-home-garden/web-data-access-gardens/user-context';

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

  const headers = { ...authHeaders(), ...(await userHeaders()) };
  try {
    const plant = await resilientFetch(apiUrl('/plants'), plantResponseSchema, {
      method: 'POST',
      headers,
      body: parsed.data,
      retries: 0,
    });
    return { ok: true, data: plant };
  } catch (error) {
    return toActionError(error, 'Could not add the plant. Please try again.');
  }
}

/** PUT is idempotent, so retries are safe. */
export async function updatePlantAction(
  plantId: number,
  input: UpdatePlantInput,
): Promise<ActionResult<Plant>> {
  const parsed = updatePlantSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid plant data' };
  }

  const headers = { ...authHeaders(), ...(await userHeaders()) };
  try {
    const plant = await resilientFetch(apiUrl(`/plants/${plantId}`), plantResponseSchema, {
      method: 'PUT',
      headers,
      body: parsed.data,
      retries: 2,
    });
    return { ok: true, data: plant };
  } catch (error) {
    return toActionError(error, 'Could not update the plant. Please try again.');
  }
}

/** DELETE is idempotent, so retries are safe. */
export async function deletePlantAction(plantId: number): Promise<ActionResult<null>> {
  const headers = { ...authHeaders(), ...(await userHeaders()) };
  try {
    await resilientFetch(apiUrl(`/plants/${plantId}`), emptyResponseSchema, {
      method: 'DELETE',
      headers,
      retries: 2,
    });
    return { ok: true, data: null };
  } catch (error) {
    return toActionError(error, 'Could not delete the plant. Please try again.');
  }
}
