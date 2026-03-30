import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { saasPrisma, schoolPrisma } from '@/lib/prisma';
import { isSuperAdmin } from '@/lib/superAdmin';
import { resolvePermissions } from '@/lib/permissions';
import { findUserByEmailOrEmployeeId, isValidLoginIdentifier } from '@/lib/dualLoginHelper';

export const authOptions = {
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email or Employee ID', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Validate identifier format (email or employeeId)
        if (!isValidLoginIdentifier(credentials.email)) {
          throw new Error('Invalid email or Employee ID format');
        }

        // Try SaaS first (for super admin), then school
        let user = null;
        
        try {
          // Try SaaS schema with raw SQL (only for email)
          if (credentials.email.includes('@')) {
            const saasUser = await (saasPrisma as any).$queryRaw`
              SELECT id, email, name, password, role, "isActive", "isSuperAdmin", 
                     'saas' as schema, null as "schoolId", null as "customRoleId"
              FROM saas."User" 
              WHERE email = ${credentials.email}
            `;
            
            if (saasUser.length > 0) {
              user = saasUser[0];
            }
          }
        } catch (error) {
          // If SaaS query fails, continue to school schema
          console.log('SaaS user lookup failed, trying school schema');
        }

        if (!user) {
          // Try school schema - support both email and employeeId
          user = await findUserByEmailOrEmployeeId(credentials.email);
          
          if (user) {
            // Add CustomRole if exists
            if (user.customRoleId) {
              user.CustomRole = await (schoolPrisma as any).CustomRole.findUnique({
                where: { id: user.customRoleId }
              });
            }
          }
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

        // Get permissions - resolve based on custom role or built-in role defaults
        let permissions = [];
        if (user.CustomRole) {
          // Custom role: use JSON permissions, fall back to built-in role
          permissions = resolvePermissions(user.role, user.CustomRole.permissions || '[]');
        } else {
          // Built-in role (admin, teacher, parent, student)
          permissions = resolvePermissions(user.role);
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
          employeeId: user.employeeId || null,
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
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // Remove domain restriction for mobile compatibility
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production' ? '__Host-next-auth.csrf-token' : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // Remove domain restriction for mobile compatibility
      },
    },
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
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
        token.employeeId = (user as any).employeeId || null;
      }

      if (token.schema === 'school' && token.email) {
        try {
          const currentUser = await (schoolPrisma as any).school_User.findFirst({
            where: {
              OR: [
                { id: token.sub as string },
                { email: token.email as string },
              ],
            },
            select: {
              role: true,
              schoolId: true,
              customRoleId: true,
              firstName: true,
              lastName: true,
              employeeId: true,
              CustomRole: {
                select: {
                  name: true,
                  permissions: true,
                },
              },
            },
          });

          if (currentUser) {
            token.role = currentUser.role;
            token.schoolId = currentUser.schoolId;
            token.customRoleId = currentUser.customRoleId;
            token.customRoleName = currentUser.CustomRole?.name ?? null;
            token.permissions = resolvePermissions(currentUser.role, currentUser.CustomRole?.permissions || null);
            token.firstName = currentUser.firstName;
            token.lastName = currentUser.lastName;
            token.employeeId = currentUser.employeeId || null;
          }
        } catch (error) {
          console.error('Failed to refresh RBAC data in JWT:', error);
        }
      }

      // Always re-fetch subscription status for school users so middleware
      // gets fresh status immediately after payment verification.
      if (token.schema === 'school' && token.schoolId) {
        try {
          const subscription = await (saasPrisma as any).subscription.findUnique({
            where: { schoolId: token.schoolId as string },
            select: { status: true, trialEndsAt: true, plan: true, currentPeriodEnd: true, autoRenew: true },
          });
          if (subscription) {
            const now = new Date();
            if (subscription.status === 'trial' && subscription.trialEndsAt) {
              const trialEnd = new Date(subscription.trialEndsAt);
              if (trialEnd < now) {
                await (saasPrisma as any).subscription.update({
                  where: { schoolId: token.schoolId as string },
                  data: { status: 'pending_payment' },
                });
                subscription.status = 'pending_payment';
              }
            }

            if (subscription.status === 'active' && subscription.currentPeriodEnd) {
              const currentPeriodEnd = new Date(subscription.currentPeriodEnd);
              if (currentPeriodEnd < now) {
                const nextStatus = subscription.autoRenew ? 'past_due' : 'expired';
                await (saasPrisma as any).subscription.update({
                  where: { schoolId: token.schoolId as string },
                  data: { status: nextStatus },
                });
                subscription.status = nextStatus;
              }
            }

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
    async session({ session, token }: { session: any; token: any }) {
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
        session.user.employeeId = token.employeeId;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
