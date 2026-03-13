// Register API Route - Next.js App Router
// Based on the School Management ERP UI Design Documents

import { NextRequest, NextResponse } from 'next/server';

// Mock user database (replace with real database)
const mockUsers: Record<string, any> = {
  'admin@schoolerp.com': {
    id: '1',
    email: 'admin@schoolerp.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    schoolId: 'school1',
  },
  'teacher@schoolerp.com': {
    id: '2',
    email: 'teacher@schoolerp.com',
    firstName: 'Teacher',
    lastName: 'User',
    role: 'teacher',
    schoolId: 'school1',
  },
  'student@schoolerp.com': {
    id: '3',
    email: 'student@schoolerp.com',
    firstName: 'Student',
    lastName: 'User',
    role: 'student',
    schoolId: 'school1',
    classId: 'class1',
    grade: '10',
  },
  'parent@schoolerp.com': {
    id: '4',
    email: 'parent@schoolerp.com',
    firstName: 'Parent',
    lastName: 'User',
    role: 'parent',
    schoolId: 'school1',
  },
};

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, email, password, role } = await request.json();

    // Validate input
    if (!firstName || !lastName || !email || !password || !role) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if user already exists
    if (mockUsers[email]) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    // Validate role
    const validRoles = ['student', 'teacher', 'parent', 'admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Create new user (in production, save to database)
    const timestamp = Date.now();
    const hash = btoa(email + timestamp).replace(/[^a-zA-Z0-9]/g, '').substr(0, 9);
    
    const newUser = {
      id: hash || 'user_' + timestamp,
      email,
      firstName,
      lastName,
      role,
      schoolId: 'school1',
      ...(role === 'student' && {
        classId: 'class1',
        grade: '10',
      }),
    };

    // Add to mock database
    mockUsers[email] = newUser;

    // Create session token (in production, use JWT)
    const token = Buffer.from(JSON.stringify({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    })).toString('base64');

    // Set HTTP-only cookie
    const response = NextResponse.json({
      user: newUser,
      message: 'Registration successful'
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
