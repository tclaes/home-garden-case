import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  userIdParamsSchema,
  userResponseSchema,
  type User,
} from '@itp-home-garden/shared-api-contracts';
import { apiUrl, authHeaders, resilientFetch } from '@itp-home-garden/web-api-client';
import { SESSION_COOKIE_NAME } from './session-cookie-name.js';

export { SESSION_COOKIE_NAME };

/**
 * Resolves the logged-in user's id from the session cookie. Returns null both when there's no
 * cookie and when its value isn't a valid user id.
 */
export async function getCurrentUserId(): Promise<number | null> {
  const cookieStore = await cookies();
  const rawUserId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const parsedUserId = userIdParamsSchema.shape.userId.safeParse(rawUserId);
  return parsedUserId.success ? parsedUserId.data : null;
}

/**
 * Same as getCurrentUserId, but redirects to /login when there's no session — for use in
 * Server Actions/Components that require a logged-in user, as defense in depth alongside
 * middleware-level route protection.
 */
export async function requireCurrentUserId(): Promise<number> {
  const userId = await getCurrentUserId();
  if (userId === null) {
    redirect('/login');
  }
  return userId;
}

/**
 * Resolves the logged-in user from the session cookie. Returns null both when there's no
 * cookie and when the lookup fails (e.g. the user was deleted after logging in) — callers
 * only care whether someone is logged in, not why the lookup didn't succeed.
 */
export async function getCurrentUser(): Promise<User | null> {
  const userId = await getCurrentUserId();
  if (userId === null) {
    return null;
  }

  try {
    return await resilientFetch(apiUrl(`/users/${userId}`), userResponseSchema, {
      headers: authHeaders(),
      retries: 1,
    });
  } catch {
    return null;
  }
}
