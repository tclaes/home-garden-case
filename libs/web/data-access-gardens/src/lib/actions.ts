'use server';

import {
  createGardenSchema,
  updateGardenSchema,
  emptyResponseSchema,
  gardenResponseSchema,
  type Garden,
  type CreateGardenInput,
  type UpdateGardenInput,
} from '@itp-home-garden/shared-api-contracts';
import { ApiError, apiUrl, authHeaders, resilientFetch } from '@itp-home-garden/web-api-client';
import { userHeaders } from './user-context.js';

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

function toActionError(error: unknown, fallback: string): { ok: false; error: string } {
  if (error instanceof ApiError) {
    return { ok: false, error: error.message };
  }
  return { ok: false, error: fallback };
}

/**
 * Create is not retried automatically: retrying a POST after a timeout risks creating the garden
 * twice. On failure, we surface the error and let the user explicitly retry to submit.
 */
export async function createGardenAction(input: CreateGardenInput): Promise<ActionResult<Garden>> {
  const parsed = createGardenSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid garden data' };
  }

  try {
    const garden = await resilientFetch(apiUrl('/gardens'), gardenResponseSchema, {
      method: 'POST',
      headers: { ...authHeaders(), ...(await userHeaders()) },
      body: parsed.data,
      retries: 0,
    });
    return { ok: true, data: garden };
  } catch (error) {
    return toActionError(error, 'Could not create the garden. Please try again.');
  }
}

/** PUT is idempotent, so it's safe to retry a few times against the flaky backend. */
export async function updateGardenAction(
  gardenId: number,
  input: UpdateGardenInput,
): Promise<ActionResult<Garden>> {
  const parsed = updateGardenSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid garden data' };
  }

  try {
    const garden = await resilientFetch(apiUrl(`/gardens/${gardenId}`), gardenResponseSchema, {
      method: 'PUT',
      headers: { ...authHeaders(), ...(await userHeaders()) },
      body: parsed.data,
      retries: 2,
    });
    return { ok: true, data: garden };
  } catch (error) {
    return toActionError(error, 'Could not update the garden. Please try again.');
  }
}

/** DELETE is idempotent (deleting an already-deleted resource is a no-op), so retries are safe. */
export async function deleteGardenAction(gardenId: number): Promise<ActionResult<null>> {
  try {
    await resilientFetch(apiUrl(`/gardens/${gardenId}`), emptyResponseSchema, {
      method: 'DELETE',
      headers: { ...authHeaders(), ...(await userHeaders()) },
      retries: 2,
    });
    return { ok: true, data: null };
  } catch (error) {
    return toActionError(error, 'Could not delete the garden. Please try again.');
  }
}
