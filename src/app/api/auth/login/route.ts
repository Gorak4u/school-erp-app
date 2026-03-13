// Login API Route - Next.js App Router
// Based on the School Management ERP UI Design Documents

import { NextRequest, NextResponse } from 'next/server';

// Mock user database (replace with real database)
const mockUsers = {
  'admin@schoolerp.com': {
    id: '1',
    email: 'admin@schoolerp.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    schoolId: 'school1',
    password: 'admin123', // In production, this would be hashed
  },
  'teacher@schoolerp.com': {
    id: '2',
    email: 'teacher@schoolerp.com',
    firstName: 'Teacher',
    lastName: 'User',
    role: 'teacher',
    schoolId: 'school1',
    password: 'teacher123',
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
    password: 'student123',
  },
  'parent@schoolerp.com': {
    id: '4',
    email: 'parent@schoolerp.com',
    firstName: 'Parent',
    lastName: 'User',
    role: 'parent',
    schoolId: 'school1',
    password: 'parent123',
  },
};

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user
    const user = mockUsers[email as keyof typeof mockUsers];
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Validate password (in production, use bcrypt to compare hashes)
    if (user.password !== password) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user;

    // Create session token (in production, use JWT)
    const token = Buffer.from(JSON.stringify({
      userId: user.id,
      email: user.email,
      role: user.role,
      exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    })).toString('base64');

    // Set HTTP-only cookie
    const response = NextResponse.json({
      user: userWithoutPassword,
      message: 'Login successful'
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
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
