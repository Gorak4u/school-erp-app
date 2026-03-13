// Middleware for Route Protection - Next.js
// Based on the School Management ERP UI Design Documents

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const publicRoutes = ['/', '/login', '/register', '/forgot-password'];

// Routes that require specific roles
const roleBasedRoutes = {
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
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next();
  }

  // Check for auth token
  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    // Redirect to login if no token
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Decode token (in production, verify JWT)
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    
    // Check if token is expired
    if (decoded.exp < Date.now()) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Check role-based access
    const userRole = decoded.role;
    
    for (const [route, requiredRoles] of Object.entries(roleBasedRoutes)) {
      if (pathname.startsWith(route) && !requiredRoles.includes(userRole)) {
        // Redirect to dashboard if user doesn't have required role
        const dashboardUrl = new URL('/dashboard', request.url);
        return NextResponse.redirect(dashboardUrl);
      }
    }

    return NextResponse.next();
  } catch (error) {
    // Invalid token
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
