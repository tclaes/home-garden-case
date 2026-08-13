'use server';

import {
  createUserSchema,
  userResponseSchema,
  type User,
  type CreateUserInput,
} from '@itp-home-garden/shared-api-contracts';
import { ApiError, apiUrl, authHeaders, resilientFetch } from '@itp-home-garden/web-api-client';

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

function toActionError(error: unknown, fallback: string): { ok: false; error: string } {
  if (error instanceof ApiError) {
    return { ok: false, error: error.message };
  }
  return { ok: false, error: fallback };
}

/**
 * Create is not retried automatically: retrying a POST after a timeout risks registering the
 * user twice. On failure, we surface the error and let the user explicitly retry to submit.
 */
export async function registerUserAction(input: CreateUserInput): Promise<ActionResult<User>> {
  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid registration data' };
  }

  try {
    const user = await resilientFetch(apiUrl('/users'), userResponseSchema, {
      method: 'POST',
      headers: authHeaders(),
      body: parsed.data,
      retries: 0,
    });
    return { ok: true, data: user };
  } catch (error) {
    return toActionError(error, 'Could not register. Please try again.');
  }
}
