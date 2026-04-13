import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_ROUTES = ['/', '/about', '/pricing', '/privacy', '/terms', '/auth/login', '/auth/register', '/auth/verify-otp', '/auth/forgot-password', '/auth/reset-password'];

const ROLE_PREFIXES: Record<string, string[]> = {
  '/applicant': ['APPLICANT'],
  '/employer': ['EMPLOYER'],
  '/admin': ['ADMIN', 'SUPER_ADMIN', 'FINANCE'],
};

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`))) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('accessToken')?.value;
  const refreshCookie = request.cookies.get('refreshToken');

  if (!refreshCookie && !accessToken) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  let role: string | undefined;

  if (accessToken) {
    const payload = parseJwtPayload(accessToken);
    if (payload && typeof payload.role === 'string') {
      role = payload.role;
    }
  }

  if (!role) {
    const legacyRole = request.cookies.get('userRole')?.value;
    if (legacyRole) role = legacyRole;
  }

  for (const [prefix, roles] of Object.entries(ROLE_PREFIXES)) {
    if (pathname.startsWith(prefix)) {
      if (!role || !roles.includes(role)) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
