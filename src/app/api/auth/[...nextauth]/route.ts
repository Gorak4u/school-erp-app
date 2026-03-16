// @ts-nocheck
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { saasPrisma, schoolPrisma } from '@/lib/prisma';
import { isSuperAdmin } from '@/lib/superAdmin';
import { resolvePermissions } from '@/lib/permissions';

export const authOptions = {
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Try SaaS first (for super admin), then school
        let user = null;
        
        try {
          // Try SaaS schema with raw SQL
          const saasUser = await (saasPrisma as any).$queryRaw`
            SELECT id, email, name, password, role, "isActive", "isSuperAdmin", 
                   'saas' as schema, null as "schoolId", null as "customRoleId"
            FROM saas."User" 
            WHERE email = ${credentials.email}
          `;
          
          if (saasUser.length > 0) {
            user = saasUser[0];
          }
        } catch (error) {
          // If SaaS query fails, continue to school schema
          console.log('SaaS user lookup failed, trying school schema');
        }

        if (!user) {
          // Try school schema
          user = await (schoolPrisma as any).school_User.findUnique({
            where: { email: credentials.email },
            include: {
              CustomRole: true,
            },
          });
        }

        if (!user) {
          throw new Error('No account found with this email');
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error('Invalid password');
        }

        if (!user.isActive) {
          throw new Error('Account is inactive');
        }

        // Get permissions
        let permissions = [];
        if (user.CustomRole) {
          permissions = resolvePermissions(user.CustomRole.permissions || '[]');
        } else if (user.role === 'admin') {
          permissions = resolvePermissions('[]');
        }

        // Build user object with proper name field
        let userName = user.name;
        if (!userName && user.firstName) {
          userName = `${user.firstName} ${user.lastName || ''}`.trim();
        }

        // Check if user is super admin from DB field OR from SUPER_ADMIN_EMAILS env var
        const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
        const isSuperAdmin = !!(user.isSuperAdmin) || superAdminEmails.includes((user.email || '').toLowerCase());

        return {
          id: user.id,
          email: user.email,
          name: userName,
          role: user.role as 'student' | 'teacher' | 'parent' | 'admin' | 'super_admin',
          customRoleId: user.customRoleId ?? null,
          customRoleName: user.CustomRole?.name ?? null,
          permissions,
          firstName: user.firstName || null,
          lastName: user.lastName || null,
          schema: user.schema || 'school',
          schoolId: user.schoolId || null,
          isSuperAdmin,
        };
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt' as const,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.schoolId = user.schoolId;
        token.customRoleId = user.customRoleId;
        token.customRoleName = user.customRoleName;
        token.permissions = user.permissions;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.schema = user.schema;
        token.isSuperAdmin = (user as any).isSuperAdmin ?? (user.role === 'super_admin');
      }

      // Always re-fetch subscription status for school users so middleware
      // gets fresh status immediately after payment verification.
      if (token.schema === 'school' && token.schoolId) {
        try {
          const subscription = await (saasPrisma as any).subscription.findUnique({
            where: { schoolId: token.schoolId as string },
            select: { status: true, trialEndsAt: true, plan: true },
          });
          if (subscription) {
            token.subscriptionStatus = subscription.status;
            token.trialEndsAt = subscription.trialEndsAt;
            token.plan = subscription.plan;
          }
        } catch (error) {
          console.error('Failed to refresh subscription in JWT:', error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub;
        session.user.role = token.role;
        session.user.schoolId = token.schoolId;
        session.user.customRoleId = token.customRoleId;
        session.user.customRoleName = token.customRoleName;
        session.user.permissions = token.permissions;
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
        session.user.schema = token.schema;
        session.user.isSuperAdmin = token.isSuperAdmin;
        session.user.subscriptionStatus = token.subscriptionStatus;
        session.user.trialEndsAt = token.trialEndsAt;
        session.user.plan = token.plan;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
