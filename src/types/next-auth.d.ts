import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: 'student' | 'teacher' | 'parent' | 'admin';
      name?: string | null;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'student' | 'teacher' | 'parent' | 'admin';
    name?: string | null;
    image?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: 'student' | 'teacher' | 'parent' | 'admin';
    firstName: string;
    lastName: string;
    userId: string;
  }
}
