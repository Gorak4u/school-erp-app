// Middleware for Route Protection - Next.js
// Uses NextAuth JWT session for authentication

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Routes that don't require authentication
const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/pricing', '/trial-expired', '/subscription-required'];

// Routes that require specific roles
const roleBasedRoutes: Record<string, string[]> = {
  '/admin': ['admin'],
  '/teacher': ['admin', 'teacher'],
  '/student': ['admin', 'teacher', 'student', 'parent'],
  '/dashboard': ['admin', 'teacher', 'student', 'parent'],
  '/students': ['admin', 'teacher'],
  '/teachers': ['admin'],
  '/assignments': ['admin', 'teacher'],
  '/attendance': ['admin', 'teacher'],
  '/reports': ['admin', 'teacher'],
  '/profile': ['admin', 'teacher', 'student', 'parent'],
  '/settings': ['admin'],
  '/fees': ['admin'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next();
  }

  // Check NextAuth JWT token
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // ── Subscription / Trial Expiry Check ──
  const subStatus = token.subscriptionStatus as string | undefined;
  const trialEndsAt = token.trialEndsAt as string | undefined;

  // Live check: if trial, verify expiry date right now
  let effectiveStatus = subStatus;
  if (subStatus === 'trial' && trialEndsAt) {
    const trialEnd = new Date(trialEndsAt);
    if (trialEnd < new Date()) {
      effectiveStatus = 'expired';
    }
  }

  // ── Super Admin routes (/admin/*) — platform owner only ──
  if (pathname.startsWith('/admin')) {
    const tokenIsSuperAdmin = token.isSuperAdmin as boolean | undefined;
    if (!tokenIsSuperAdmin) {
      const dashboardUrl = new URL('/dashboard', request.url);
      return NextResponse.redirect(dashboardUrl);
    }
    return NextResponse.next();
  }

  // Block expired/cancelled users → redirect to appropriate page
  if (effectiveStatus === 'expired' || effectiveStatus === 'cancelled') {
    // Allow access to API routes (so subscription check API still works)
    if (pathname.startsWith('/api/')) return NextResponse.next();

    const isTrialExpired = subStatus === 'trial' || (subStatus === 'expired' && trialEndsAt);
    const redirectPath = isTrialExpired ? '/trial-expired' : '/subscription-required';
    const redirectUrl = new URL(redirectPath, request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Check role-based access (school-level)
  const userRole = token.role as string;

  for (const [route, requiredRoles] of Object.entries(roleBasedRoutes)) {
    if (pathname.startsWith(route) && !requiredRoles.includes(userRole)) {
      const dashboardUrl = new URL('/dashboard', request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|uploads).*)',
  ],
};
