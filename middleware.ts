// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

// ADD '/share' to this list
const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout', '/share'];

function isPublicPath(pathname: string) {
  // Check if path matches exact public path OR starts with it (e.g. /share/123)
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return true;
  }
  // ... rest of the code remains the same
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/api/health')
  ) {
    return true;
  }
  return false;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // ... rest of the login check logic
  const sessionId = req.cookies.get('sessionId')?.value;

  if (!sessionId) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sw.js|swe-worker|workbox|manifest.json).*)',],
};