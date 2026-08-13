import { userResponseSchema, type User } from '@itp-home-garden/shared-api-contracts';
import { ApiError, apiUrl, resilientFetch } from '@itp-home-garden/web-api-client';
import { authHeaders } from './session.js';

/**
 * Returns the currently logged-in user, or null if there is no session (or it's expired) —
 * used to render the header, so "not logged in" isn't an error state here.
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    return await resilientFetch(apiUrl('/auth/me'), userResponseSchema, {
      headers: await authHeaders(),
      retries: 0,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}
