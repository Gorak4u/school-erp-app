// Production-ready Middleware for Route Protection
// Uses NextAuth JWT session for authentication with comprehensive security

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { extractSubdomain } from '@/lib/subdomain';
import { saasPrisma } from '@/lib/prisma';
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

// Production environment check
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

// Rate limiting configuration
const RATE_LIMITS = {
  '/api/auth/login': { requests: 10, window: 60000 }, // 10 login attempts per minute
  '/api/auth/register': { requests: 5, window: 300000 }, // 5 registrations per 5 minutes
  '/api/create-payment-order': { requests: 20, window: 60000 }, // 20 payment orders per minute
  '/api/upload': { requests: 10, window: 60000 }, // 10 uploads per minute
};

// Security headers for production
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  ...(isProduction && {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https: wss: https://api.razorpay.com;",
  }),
};

// Routes that don't require authentication (production-ready)
const publicRoutes = [
  // Essential pages
  '/', 
  '/login', 
  '/register', 
  '/forgot-password', 
  '/reset-password', 
  '/pricing', 
  '/trial-expired', 
  '/subscription-required', 
  '/school-login', 
  '/billing',
  
  // Public APIs
  '/api/plans', 
  '/api/admin/plans', 
  '/api/auth', 
  '/api/register', 
  '/api/reset-password', 
  '/api/promo-codes/validate', 
  '/api/create-payment-order',
  '/api/verify-payment',
  '/api/razorpay/webhook',
  '/api/razorpay/create-order',
  '/api/razorpay/verify-payment',
  '/api/razorpay/verify-subscription-payment',
  '/api/school/by-subdomain',
  '/api/upload',
  
  // Chrome DevTools and browser-specific files
  '/.well-known',
];

// Development-only routes (blocked in production)
const developmentOnlyRoutes = [
  '/api/cron',
  '/api/test',
  '/api/debug',
];

// Blocked routes in production
const blockedInProduction = [
  '/api/test',
  '/api/debug',
  '/api/cron',
];

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

// Simple in-memory rate limiting for production (consider Redis for distributed systems)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= limit) {
    return false;
  }
  
  record.count++;
  return true;
}

function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded ? forwarded.split(',')[0] : realIp || 'unknown';
  return `${ip}:${request.headers.get('user-agent')?.slice(0, 50) || 'unknown'}`;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // ── Production Security Checks ─────────────────────────────────────────
  
  // Block development routes in production
  if (isProduction) {
    const isBlockedRoute = blockedInProduction.some(route => pathname.startsWith(route));
    if (isBlockedRoute) {
      console.warn(`🚫 Blocked attempt to access development route: ${pathname}`);
      return NextResponse.json(
        { error: 'Endpoint not available in production' },
        { status: 404 }
      );
    }
  }
  
  // Rate limiting for sensitive endpoints
  for (const [route, config] of Object.entries(RATE_LIMITS)) {
    if (pathname.startsWith(route)) {
      const clientId = getClientIdentifier(request);
      const rateLimitKey = `${route}:${clientId}`;
      
      if (!checkRateLimit(rateLimitKey, config.requests, config.window)) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429 }
        );
      }
      break;
    }
  }
  
  // Add security headers to all responses
  const response = NextResponse.next();
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // ── Cron Job Security ─────────────────────────────────────────────────────
  // Only allow cron jobs with proper authentication in production
  if (pathname.startsWith('/api/cron')) {
    if (isProduction) {
      const cronSecret = request.headers.get('x-cron-secret');
      if (cronSecret !== process.env.CRON_SECRET) {
        console.warn(`🚫 Unauthorized cron attempt: ${pathname}`);
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }
    return response;
  }

  // ── Subdomain Detection ──────────────────────────────────────────────────
  const schoolSubdomain = extractSubdomain(hostname);

  // ── Non-subdomain deployment: Allow API routes to pass through ────────────
  // This handles production deployments on Railway/Heroku/Vercel without subdomains
  if (!schoolSubdomain && pathname.startsWith('/api/')) {
    // Check auth but don't redirect - let API handle 401/403 responses
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      // Return JSON 401 for API routes instead of redirect
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Continue with normal API handling (permission checks below)
  } else if (schoolSubdomain) {
    // CRITICAL: Validate school exists in database before allowing access
    try {
      const school = await (saasPrisma as any).School.findUnique({
        where: { domain: schoolSubdomain },
        select: { id: true, isActive: true }
      });

      if (!school) {
        console.warn(`🚫 Access attempt to non-existent school: ${schoolSubdomain}`);
        // Return error page for non-existent school
        return new NextResponse(
          `<!DOCTYPE html>
          <html>
            <head><title>School Not Found</title></head>
            <body style="font-family:system-ui;background:#1a1a2e;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
              <div style="text-align:center;padding:40px;max-width:400px;">
                <div style="width:80px;height:80px;background:#ef444420;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">
                  <svg width="40" height="40" fill="none" stroke="#ef4444" stroke-width="2"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                </div>
                <h1 style="font-size:24px;margin-bottom:10px;">Access Denied</h1>
                <p style="color:#ef4444;font-weight:600;">School &quot;${schoolSubdomain}&quot; does not exist.</p>
                <p style="color:#9ca3af;font-size:14px;">Please check the URL or contact your administrator.</p>
              </div>
            </body>
          </html>`,
          { status: 404, headers: { 'Content-Type': 'text/html' } }
        );
      }

      if (!school.isActive) {
        console.warn(`🚫 Access attempt to inactive school: ${schoolSubdomain}`);
        return NextResponse.json({ error: 'School account is inactive' }, { status: 403 });
      }
    } catch (error) {
      console.error(`🚫 Error validating school: ${error}`);
      return NextResponse.json({ error: 'Failed to validate school' }, { status: 500 });
    }

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

  // ── Public Route Check ───────────────────────────────────────────────────
  // Allow public routes without authentication
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return response;
  }

  // ── Performance & Caching ─────────────────────────────────────────────────
  // Add caching headers for fee-related APIs (production optimized)
  if (pathname.startsWith('/api/fees/structures') ||
      pathname.startsWith('/api/fees/discounts')) {
    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
    return response;
  } else if (pathname.startsWith('/api/fees/statistics') ||
             pathname.startsWith('/api/fees/collections/summary')) {
    response.headers.set('Cache-Control', 'public, max-age=120, stale-while-revalidate=30');
    return response;
  } else if (pathname.startsWith('/api/fees/students') ||
             pathname.startsWith('/api/fees/records')) {
    response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=15');
    return response;
  }

  // ── Billing Page Access ─────────────────────────────────────────────────────
  // Allow billing page for all authenticated users (including expired trials)
  if (pathname === '/billing') {
    return response;
  }

  // ── Authentication Check ───────────────────────────────────────────────────
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    console.warn(`🚫 Unauthorized access attempt: ${pathname}`);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Token Validation ────────────────────────────────────────────────────────
  // Validate token structure and required fields
  // Most APIs need email, some can work with just email for identification
  if (!token.email) {
    console.error(`🚫 Invalid token structure for: ${pathname} - missing email`);
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }
  
  // Only require ID for user-specific operations (not system APIs)
  const isUserSpecificApi = pathname.startsWith('/api/students') ||
                           pathname.startsWith('/api/teachers') ||
                           pathname.startsWith('/api/fees') ||
                           pathname.startsWith('/api/attendance') ||
                           pathname.startsWith('/api/assignments') ||
                           pathname.startsWith('/api/alumni') ||
                           pathname.startsWith('/api/expenses') ||
                           pathname.startsWith('/api/transport') ||
                           pathname.startsWith('/api/leave') ||
                           pathname.startsWith('/api/exams') ||
                           pathname.startsWith('/api/budgets');
  
  if (isUserSpecificApi && !token.id) {
    console.error(`🚫 Invalid token structure for: ${pathname} - missing ID for user-specific operation`);
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // ── Super Admin Check ───────────────────────────────────────────────────────
  const tokenIsSuperAdmin = token.isSuperAdmin as boolean | undefined;
  const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
  const isEffectivelySuperAdmin = tokenIsSuperAdmin || superAdminEmails.includes((token.email as string || '').toLowerCase());

  // Super admins bypass ALL checks (subscription, trial, role-based, etc.)
  if (isEffectivelySuperAdmin) {
    return response;
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

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|uploads).*)',
  ],
  // Production-ready configuration
  // Increase body size limit for file uploads and email attachments
  middlewareClientMaxBodySize: '25mb',
};
