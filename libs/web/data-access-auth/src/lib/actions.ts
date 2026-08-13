'use server';

import {
  authResponseSchema,
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from '@itp-home-garden/shared-api-contracts';
import { ApiError, apiUrl, resilientFetch } from '@itp-home-garden/web-api-client';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from './session.js';

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

function toActionError(error: unknown, fallback: string): { ok: false; error: string } {
  if (error instanceof ApiError) {
    return { ok: false, error: error.message };
  }
  return { ok: false, error: fallback };
}

async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function registerAction(input: RegisterInput): Promise<ActionResult<null>> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid registration data' };
  }

  try {
    const result = await resilientFetch(apiUrl('/auth/register'), authResponseSchema, {
      method: 'POST',
      body: parsed.data,
      retries: 0,
    });
    await setSessionCookie(result.token);
    return { ok: true, data: null };
  } catch (error) {
    return toActionError(error, 'Could not create your account. Please try again.');
  }
}

export async function loginAction(input: LoginInput): Promise<ActionResult<null>> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid login data' };
  }

  try {
    const result = await resilientFetch(apiUrl('/auth/login'), authResponseSchema, {
      method: 'POST',
      body: parsed.data,
      retries: 0,
    });
    await setSessionCookie(result.token);
    return { ok: true, data: null };
  } catch (error) {
    return toActionError(error, 'Could not log you in. Please try again.');
  }
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect('/login');
}
