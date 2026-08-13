import { requireCurrentUserId } from '@itp-home-garden/web-data-access-users/session';

/**
 * The trusted per-user header the API scopes garden/plant reads and writes by, sourced from the
 * session cookie server-side. Redirects to /login if there's no session — defense in depth
 * alongside middleware-level route protection.
 */
export async function userHeaders(): Promise<Record<string, string>> {
  const userId = await requireCurrentUserId();
  return { 'X-User-Id': String(userId) };
}
