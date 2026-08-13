export const SESSION_COOKIE_NAME = 'session';

/** 7 days, matching the JWT's own expiresIn set at sign time on the backend. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

/**
 * Reads the logged-in user's session token from the httpOnly cookie and shapes it into an
 * Authorization header. Only ever called from server-side code (Server Components, Server
 * Actions) so the token never reaches the client bundle.
 *
 * `next/headers` is imported dynamically here rather than statically: this module is re-exported
 * from the same data-access barrel as Server Actions that Client Components import (e.g.
 * `deleteGardenAction`), and a static `next/headers` import in that reachable graph makes
 * webpack's client bundler fail the build, even though this function itself never runs client-side.
 */
export async function authHeaders(): Promise<Record<string, string>> {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return token ? { Authorization: `Bearer ${token}` } : {};
}
