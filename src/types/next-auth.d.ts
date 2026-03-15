import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: 'student' | 'teacher' | 'parent' | 'admin' | 'super_admin';
      schoolId: string | null;
      isSuperAdmin: boolean;
      subscriptionStatus?: string | null;
      trialEndsAt?: string | null;
      plan?: string | null;
      name?: string | null;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'student' | 'teacher' | 'parent' | 'admin' | 'super_admin';
    schoolId: string | null;
    isSuperAdmin: boolean;
    name?: string | null;
    image?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: 'student' | 'teacher' | 'parent' | 'admin' | 'super_admin';
    firstName: string;
    lastName: string;
    userId: string;
    schoolId: string | null;
    isSuperAdmin: boolean;
    subscriptionStatus?: string | null;
    trialEndsAt?: string | null;
    plan?: string | null;
  }
}
