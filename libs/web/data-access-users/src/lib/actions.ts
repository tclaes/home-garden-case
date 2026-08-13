'use server';

import { cookies } from 'next/headers';
import {
  createUserSchema,
  emailParamsSchema,
  userResponseSchema,
  type User,
  type CreateUserInput,
} from '@itp-home-garden/shared-api-contracts';
import { ApiError, apiUrl, authHeaders, resilientFetch } from '@itp-home-garden/web-api-client';
import { SESSION_COOKIE_NAME } from './session.js';

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

const SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

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

/**
 * Login is email-only: there is no password concept in the user model yet. A match is
 * confirmed via the existing email lookup endpoint. The cookie set on success is not a real
 * session token (unsigned, unencrypted userId) — fine while nothing reads/authorizes on it yet,
 * but it would need hardening before anything relies on it for access control.
 */
export async function loginUserAction(input: {
  emailAddress: string;
}): Promise<ActionResult<User>> {
  const parsed = emailParamsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid email address' };
  }

  try {
    const user = await resilientFetch(
      apiUrl(`/users/email/${encodeURIComponent(parsed.data.emailAddress)}`),
      userResponseSchema,
      { headers: authHeaders(), retries: 2 },
    );

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, String(user.userId), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
    });

    return { ok: true, data: user };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { ok: false, error: 'No account found with this email address.' };
    }
    return toActionError(error, 'Could not log in. Please try again.');
  }
}
