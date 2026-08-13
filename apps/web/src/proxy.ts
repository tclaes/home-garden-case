import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@itp-home-garden/web-data-access-users/session-cookie-name';

const AUTH_PATHS = new Set(['/login', '/register', '/register/success']);

export function proxy(request: NextRequest) {
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  const isAuthPath = AUTH_PATHS.has(request.nextUrl.pathname);

  if (!hasSession && !isAuthPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (hasSession && isAuthPath) {
    return NextResponse.redirect(new URL('/gardens', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)'],
};
