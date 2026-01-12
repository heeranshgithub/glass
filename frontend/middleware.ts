import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Only apply waitlist protection in production
  // In development, allow all routes for testing
  // if (process.env.NODE_ENV !== 'production') {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // PRODUCTION MODE: Only allow /waitlist route

  // 1. Allow access to waitlist page (only allowed route)
  if (pathname === '/waitlist' || pathname.startsWith('/waitlist/')) {
    return NextResponse.next();
  }

  // 2. Allow Next.js internals (required for app to function)
  if (pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  // 3. Allow static assets (images, fonts, favicon, etc.)
  if (
    pathname.match(
      /\.(ico|png|jpg|jpeg|gif|svg|webp|woff|woff2|ttf|eot|css|js)$/
    )
  ) {
    return NextResponse.next();
  }

  // 4. Redirect ALL other routes to /waitlist
  // This includes: /, /login, /register, /home, /chat/*, /settings, etc.
  const url = request.nextUrl.clone();
  url.pathname = '/waitlist';
  // Preserve query parameters if any (e.g., ?ref=twitter)
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (handled by pathname.match above)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
