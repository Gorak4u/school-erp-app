// Middleware for Route Protection - Next.js
// Uses NextAuth JWT session for authentication

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { ensureSuperAdmin } from '@/lib/super-admin-init';
import { extractSubdomain } from '@/lib/subdomain';
import {
  canCreateStudentsAccess,
  canDeleteStudentsAccess,
  canEditStudentsAccess,
  canLockStudentsAccess,
  canManageAlumniAccess,
  canManageFeesAccess,
  canManageStudentLifecycleAccess,
  canViewAlumniAccess,
  canViewAlumniDuesAccess,
  canViewFeesAccess,
  canViewStudentsAccess,
} from '@/lib/permissions';

export const runtime = 'nodejs';

// Routes that don't require authentication
const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/pricing', '/trial-expired', '/subscription-required', '/school-login', '/api/plans', '/api/admin/plans', '/api/auth', '/api/register', '/api/reset-password', '/api/test/subscription-discounts', '/api/test/create-sample-promo', '/api/promo-codes/validate', '/api/cron/promo-cleanup'];

// Routes that require specific roles (built-in role fallback for users without custom roles)
const roleBasedRoutes: Record<string, string[]> = {
  '/admin': ['admin'],
  '/student': ['admin', 'teacher', 'student', 'parent'],
  '/dashboard': ['admin', 'teacher', 'student', 'parent'],
  '/students': ['admin'],
  '/teachers': ['admin'],
  '/attendance': ['admin'],
  '/reports': ['admin'],
  '/profile': ['admin', 'teacher', 'student', 'parent'],
  '/settings': ['admin', 'super_admin'],
  '/fees': ['admin'],
  '/fee-collection': ['admin'],
  '/assignments': ['admin'],
  '/alumni': ['admin'],
  '/expenses': ['admin'],
  '/transport': ['admin'],
  '/subscription': ['admin'],
};

// Routes that require specific permissions (used when user has a custom role)
const permissionBasedRoutes: Record<string, string> = {
  '/dashboard': 'view_dashboard',
  '/students': 'view_students',
  '/teachers': 'view_teachers',
  '/attendance': 'view_attendance',
  '/fees': 'view_fees',
  '/fee-collection': 'manage_fees', // SECURITY: Fee collection requires manage_fees, not just view_fees
  '/reports': 'view_reports',
  '/settings': 'view_settings',
  '/alumni': 'view_alumni',
  '/expenses': 'view_expenses',
  '/subscription': 'manage_settings',
};

let superAdminChecked = false;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // ── Subdomain Detection ──────────────────────────────────────────────────
  const schoolSubdomain = extractSubdomain(hostname);

  if (schoolSubdomain) {
    // Inject subdomain into request headers so pages can read it
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-school-subdomain', schoolSubdomain);

    // On a subdomain, if user is accessing root path, redirect to school login
    if (pathname === '/' || pathname === '') {
      const loginUrl = new URL('/school-login', request.url);
      loginUrl.searchParams.set('subdomain', schoolSubdomain);
      return NextResponse.redirect(loginUrl);
    }

    // On a subdomain, only allow: school-login page, forgot/reset-password, and API routes
    const subdomainPublic = ['/school-login', '/forgot-password', '/reset-password', '/api/'];
    const isPublicOnSubdomain = subdomainPublic.some(r => pathname === r || pathname.startsWith(r));

    if (isPublicOnSubdomain) {
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    // Unauthenticated → redirect to school login
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const loginUrl = new URL('/school-login', request.url);
      loginUrl.searchParams.set('subdomain', schoolSubdomain);
      return NextResponse.redirect(loginUrl);
    }

    // Authenticated → pass through (inject header)
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Skip super admin check in middleware - it should run at startup only
  // This prevents potential security issues and performance impact

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

  // ── Super Admin Check (FIRST) — bypass all restrictions ──
  const tokenIsSuperAdmin = token.isSuperAdmin as boolean | undefined;
  const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
  const isEffectivelySuperAdmin = tokenIsSuperAdmin || superAdminEmails.includes((token.email as string || '').toLowerCase());

  // Super admins bypass ALL checks (subscription, trial, role-based, etc.)
  if (isEffectivelySuperAdmin) {
    return NextResponse.next();
  }

  // ── Subscription / Trial Expiry Check ──
  const subStatus = token.subscriptionStatus as string | undefined;
  const trialEndsAt = token.trialEndsAt as string | undefined;

  // Live check: if trial, verify expiry date right now
  let effectiveStatus = subStatus;
  let isExpiredTrial = false;
  if (subStatus === 'trial' && trialEndsAt) {
    const trialEnd = new Date(trialEndsAt);
    if (trialEnd < new Date()) {
      // Trial has ended → treat as pending_payment so user can choose a plan
      effectiveStatus = 'pending_payment';
      isExpiredTrial = true;
    }
  }

  // ── Super Admin routes (/admin/*) — platform owner only ──
  if (pathname.startsWith('/admin')) {
    const tokenIsSuperAdminAdmin = token.isSuperAdmin as boolean | undefined;
    const superAdminEmailsAdmin = (process.env.SUPER_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
    const isAdminUser = tokenIsSuperAdminAdmin || superAdminEmailsAdmin.includes((token.email as string || '').toLowerCase());
    if (!isAdminUser) {
      const dashboardUrl = new URL('/dashboard', request.url);
      return NextResponse.redirect(dashboardUrl);
    }
    return NextResponse.next();
  }

  // Block fully inactive subscriptions
  if (['cancelled', 'expired', 'suspended'].includes(effectiveStatus || '')) {
    if (pathname.startsWith('/api/')) return NextResponse.next();
    return NextResponse.redirect(new URL('/subscription-required', request.url));
  }

  // Handle pending payment states (expired trial, failed renewal, incomplete paid setup)
  if (effectiveStatus === 'pending_payment' || effectiveStatus === 'past_due') {
    // Allow API routes for payment processing
    if (pathname.startsWith('/api/')) return NextResponse.next();

    // Allow billing, pricing, and subscription pages
    const allowedRoutes = ['/settings', '/subscription-required', '/profile', '/billing', '/pricing', '/subscription'];
    const isAllowed = allowedRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));

    if (!isAllowed) {
      // Expired trial → prompt to choose a plan
      // Incomplete paid plan → prompt to complete payment
      const redirectParam = isExpiredTrial ? 'trial_expired=true' : 'pending=true';
      return NextResponse.redirect(new URL(`/subscription-required?${redirectParam}`, request.url));
    }
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
      const routeAccessInput = {
        role: userRole,
        isSuperAdmin: false,
        permissions: userPermissions,
      };

      if (route === '/students') {
        if (!canViewStudentsAccess(routeAccessInput)) {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        continue;
      }

      if (route === '/alumni') {
        if (!canViewAlumniAccess(routeAccessInput)) {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        continue;
      }

      const requiredPermission = permissionBasedRoutes[route];
      if (requiredPermission) {
        if (!userPermissions.includes(requiredPermission)) {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      } else if (!requiredRoles.includes(userRole)) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } else {
      // Fallback: built-in role check
      if (!requiredRoles.includes(userRole)) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }

  // ── API Route Permission Checks ───────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    // Student operations
    if (pathname.startsWith('/api/students')) {
      if (userCustomRoleId) {
        const studentAccessInput = {
          role: userRole,
          isSuperAdmin: false,
          permissions: userPermissions,
        };

        if (pathname.startsWith('/api/students/promote') || pathname.startsWith('/api/students/exit')) {
          if (!canManageStudentLifecycleAccess(studentAccessInput)) {
            return NextResponse.json({ error: 'Insufficient permissions to manage student lifecycle' }, { status: 403 });
          }
        } else if (pathname.startsWith('/api/students/bulk-lock')) {
          if (!canLockStudentsAccess(studentAccessInput)) {
            return NextResponse.json({ error: 'Insufficient permissions to manage academic year locks' }, { status: 403 });
          }
        } else if (pathname.includes('/delete') || request.method === 'DELETE') {
          if (!canDeleteStudentsAccess(studentAccessInput)) {
            return NextResponse.json({ error: 'Insufficient permissions to delete students' }, { status: 403 });
          }
        } else if (pathname.includes('/create') || (pathname.endsWith('/students') && request.method === 'POST')) {
          if (!canCreateStudentsAccess(studentAccessInput)) {
            return NextResponse.json({ error: 'Insufficient permissions to create students' }, { status: 403 });
          }
        } else if (request.method === 'PUT' || request.method === 'PATCH') {
          if (!canEditStudentsAccess(studentAccessInput)) {
            return NextResponse.json({ error: 'Insufficient permissions to edit students' }, { status: 403 });
          }
        } else if (request.method === 'GET') {
          if (!canViewStudentsAccess(studentAccessInput)) {
            return NextResponse.json({ error: 'Insufficient permissions to view students' }, { status: 403 });
          }
        }
      }
    }

    if (pathname.startsWith('/api/alumni')) {
      if (userCustomRoleId) {
        const alumniAccessInput = {
          role: userRole,
          isSuperAdmin: false,
          permissions: userPermissions,
        };

        if (pathname.includes('/dues')) {
          if (!canViewAlumniDuesAccess(alumniAccessInput)) {
            return NextResponse.json({ error: 'Insufficient permissions to view alumni dues' }, { status: 403 });
          }
        } else if (request.method === 'GET') {
          if (!canViewAlumniAccess(alumniAccessInput)) {
            return NextResponse.json({ error: 'Insufficient permissions to view alumni' }, { status: 403 });
          }
        } else if (!canManageAlumniAccess(alumniAccessInput)) {
          return NextResponse.json({ error: 'Insufficient permissions to manage alumni' }, { status: 403 });
        }
      }
    }
    // Teacher operations
    if (pathname.startsWith('/api/teachers')) {
      if (pathname.includes('/delete') || request.method === 'DELETE') {
        if (userCustomRoleId && !userPermissions.includes('delete_teachers')) {
          return NextResponse.json({ error: 'Insufficient permissions to delete teachers' }, { status: 403 });
        }
      }
      if (pathname.includes('/create') || (pathname.endsWith('/teachers') && request.method === 'POST')) {
        if (userCustomRoleId && !userPermissions.includes('create_teachers')) {
          return NextResponse.json({ error: 'Insufficient permissions to create teachers' }, { status: 403 });
        }
      }
      if (request.method === 'PUT' || request.method === 'PATCH') {
        if (userCustomRoleId && !userPermissions.includes('edit_teachers')) {
          return NextResponse.json({ error: 'Insufficient permissions to edit teachers' }, { status: 403 });
        }
      }
    }
    
    // Fee operations
    if (pathname.startsWith('/api/fees')) {
      if (userCustomRoleId) {
        const feeAccessInput = {
          role: userRole,
          isSuperAdmin: false,
          permissions: userPermissions,
        };

        if (request.method === 'GET') {
          if (!canViewFeesAccess(feeAccessInput)) {
            return NextResponse.json({ error: 'Insufficient permissions to view fees' }, { status: 403 });
          }
        } else if (!canManageFeesAccess(feeAccessInput)) {
          return NextResponse.json({ error: 'Insufficient permissions to manage fees' }, { status: 403 });
        }
      }
    }
    
    // Settings operations
    if (pathname.startsWith('/api/school-structure') || pathname.startsWith('/api/settings')) {
      if (userCustomRoleId && !userPermissions.includes('manage_settings')) {
        return NextResponse.json({ error: 'Insufficient permissions to manage settings' }, { status: 403 });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|uploads).*)',
  ],
  // Increase body size limit for email attachments with base64 images
  // Correct property for Next.js 16.1.6
  middlewareClientMaxBodySize: '50mb',
};
