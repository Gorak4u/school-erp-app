// Middleware for Route Protection - Next.js
// Uses NextAuth JWT session for authentication

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { ensureSuperAdmin } from '@/lib/super-admin-init';

// Routes that don't require authentication
const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/pricing', '/trial-expired', '/subscription-required'];

// Routes that require specific roles (built-in role fallback for users without custom roles)
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
  '/fee-collection': ['admin'],
};

// Routes that require specific permissions (used when user has a custom role)
const permissionBasedRoutes: Record<string, string> = {
  '/students': 'view_students',
  '/teachers': 'view_teachers',
  '/attendance': 'view_attendance',
  '/fees': 'view_fees',
  '/fee-collection': 'view_fees',
  '/reports': 'view_reports',
  '/settings': 'view_settings',
};

let superAdminChecked = false;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check super admin only once on first request (non-API routes)
  if (!superAdminChecked && !pathname.startsWith('/api/')) {
    try {
      await ensureSuperAdmin();
      superAdminChecked = true;
    } catch (error) {
      console.error('❌ Middleware super admin check failed:', error);
    }
  }

  // Allow public routes
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next();
  }

  // Add caching headers for fee-related APIs
  if (pathname.startsWith('/api/fees/structures') ||
      pathname.startsWith('/api/fees/discounts')) {
    // Cache fee structures and discounts for 5 minutes
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
    return response;
  } else if (pathname.startsWith('/api/fees/statistics') ||
             pathname.startsWith('/api/fees/collections/summary')) {
    // Cache aggregated reports for 2 minutes
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'public, max-age=120, stale-while-revalidate=30');
    return response;
  } else if (pathname.startsWith('/api/fees/students') ||
             pathname.startsWith('/api/fees/records')) {
    // Cache student data for 1 minute
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=15');
    return response;
  }

  // Allow billing page for all authenticated users (including expired trials)
  if (pathname === '/billing') {
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
    const superAdminEmailsAdmin = (process.env.SUPER_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
    const isAdminUser = tokenIsSuperAdmin || superAdminEmailsAdmin.includes((token.email as string || '').toLowerCase());
    if (!isAdminUser) {
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

  // Handle pending_payment users - restrict access to billing pages only
  if (effectiveStatus === 'pending_payment') {
    // Allow API routes for payment processing
    if (pathname.startsWith('/api/')) return NextResponse.next();
    
    // Allow billing and payment pages
    const allowedRoutes = ['/settings', '/subscription-required', '/profile', '/billing'];
    const isAllowed = allowedRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));
    
    if (!isAllowed) {
      const billingUrl = new URL('/subscription-required?pending=true', request.url);
      return NextResponse.redirect(billingUrl);
    }
    return NextResponse.next();
  }

  // Super admins bypass all role-based route checks — they can access everything
  const tokenIsSuperAdmin = token.isSuperAdmin as boolean | undefined;
  const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
  const isEffectivelySuperAdmin = tokenIsSuperAdmin || superAdminEmails.includes((token.email as string || '').toLowerCase());

  if (isEffectivelySuperAdmin) {
    return NextResponse.next();
  }

  // Check access: permission-based first (if user has custom role), then role-based fallback
  const userRole = token.role as string;
  const userCustomRoleId = token.customRoleId as string | undefined;
  const userPermissions: string[] = (token.permissions as string[]) || [];

  for (const [route, requiredRoles] of Object.entries(roleBasedRoutes)) {
    if (!pathname.startsWith(route)) continue;

    // If user has a custom role, check permissions instead of built-in role
    if (userCustomRoleId) {
      const requiredPermission = permissionBasedRoutes[route];
      if (requiredPermission && !userPermissions.includes(requiredPermission)) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } else {
      // Fallback: built-in role check
      if (!requiredRoles.includes(userRole)) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|uploads).*)',
  ],
};
