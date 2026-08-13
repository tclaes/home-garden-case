import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@itp-home-garden/web-data-access-auth';

const PUBLIC_PATHS = ['/login', '/register'];

/**
 * Gates every route behind a session cookie, redirecting to /login when it's missing. This is a
 * presence check only — an expired-but-present token still gets in here and fails later with a
 * 401 from the API, which the page-level error boundaries handle (see gardens/error.tsx).
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  const hasSession = request.cookies.has(SESSION_COOKIE_NAME);

  if (!hasSession && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (hasSession && isPublicPath) {
    return NextResponse.redirect(new URL('/gardens', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
