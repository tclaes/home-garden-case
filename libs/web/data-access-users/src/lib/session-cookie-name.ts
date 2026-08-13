/**
 * Zero-dependency constant, safe to import from Next.js Edge Middleware (which cannot use
 * `next/headers`' `cookies()` the way Server Components/Actions can).
 */
export const SESSION_COOKIE_NAME = 'session_user_id';
