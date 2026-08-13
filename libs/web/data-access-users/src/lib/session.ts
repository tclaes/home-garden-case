import { cookies } from 'next/headers';
import {
  userIdParamsSchema,
  userResponseSchema,
  type User,
} from '@itp-home-garden/shared-api-contracts';
import { apiUrl, authHeaders, resilientFetch } from '@itp-home-garden/web-api-client';

export const SESSION_COOKIE_NAME = 'session_user_id';

/**
 * Resolves the logged-in user from the session cookie. Returns null both when there's no
 * cookie and when the lookup fails (e.g. the user was deleted after logging in) — callers
 * only care whether someone is logged in, not why the lookup didn't succeed.
 */
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const rawUserId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const parsedUserId = userIdParamsSchema.shape.userId.safeParse(rawUserId);
  if (!parsedUserId.success) {
    return null;
  }

  try {
    return await resilientFetch(apiUrl(`/users/${parsedUserId.data}`), userResponseSchema, {
      headers: authHeaders(),
      retries: 1,
    });
  } catch {
    return null;
  }
}
