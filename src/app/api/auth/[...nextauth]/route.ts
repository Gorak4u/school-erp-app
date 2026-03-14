// @ts-nocheck
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { isSuperAdmin } from '@/lib/superAdmin';

export const authOptions: any = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const user = await (prisma as any).user.findUnique({
          where: { email: credentials.email },
          include: {
            school: {
              include: { subscription: true },
            },
          },
        });

        if (!user) {
          throw new Error('No account found with this email');
        }

        if (!user.isActive) {
          throw new Error('Your account has been deactivated');
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error('Invalid password');
        }

        // Build subscription info for JWT
        const sub = user.school?.subscription;
        let subscriptionStatus = 'none';
        let subscriptionPlan = 'none';
        let trialEndsAt: string | null = null;
        let schoolId: string | null = user.schoolId;

        // Super admin always has active enterprise subscription
        if (isSuperAdmin(user.email)) {
          subscriptionStatus = 'active';
          subscriptionPlan = 'enterprise';
          trialEndsAt = null;
        } else if (sub) {
          subscriptionPlan = sub.plan;
          const now = new Date();
          if (sub.status === 'trial') {
            const trialEnd = sub.trialEndsAt ? new Date(sub.trialEndsAt) : null;
            trialEndsAt = sub.trialEndsAt?.toISOString() || null;
            subscriptionStatus = trialEnd && trialEnd < now ? 'expired' : 'trial';
          } else if (sub.status === 'active') {
            const periodEnd = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null;
            subscriptionStatus = periodEnd && periodEnd < now ? 'expired' : 'active';
          } else {
            subscriptionStatus = sub.status; // expired, cancelled, past_due
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role as 'student' | 'teacher' | 'parent' | 'admin',
          firstName: user.firstName,
          lastName: user.lastName,
          image: user.avatar,
          subscriptionStatus,
          subscriptionPlan,
          trialEndsAt,
          schoolId,
          isSuperAdmin: isSuperAdmin(user.email),
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.firstName = (user as any).firstName;
        token.lastName = (user as any).lastName;
        token.userId = user.id;
        token.subscriptionStatus = (user as any).subscriptionStatus;
        token.subscriptionPlan = (user as any).subscriptionPlan;
        token.trialEndsAt = (user as any).trialEndsAt;
        token.schoolId = (user as any).schoolId;
        token.isSuperAdmin = (user as any).isSuperAdmin;
      }
      // Re-check trial expiry on every token refresh
      if (token.subscriptionStatus === 'trial' && token.trialEndsAt) {
        const trialEnd = new Date(token.trialEndsAt as string);
        if (trialEnd < new Date()) {
          token.subscriptionStatus = 'expired';
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session.user as any).role = token.role;
        (session.user as any).firstName = token.firstName;
        (session.user as any).lastName = token.lastName;
        (session.user as any).id = token.userId;
        (session.user as any).subscriptionStatus = token.subscriptionStatus;
        (session.user as any).subscriptionPlan = token.subscriptionPlan;
        (session.user as any).trialEndsAt = token.trialEndsAt;
        (session.user as any).schoolId = token.schoolId;
        (session.user as any).isSuperAdmin = token.isSuperAdmin;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
