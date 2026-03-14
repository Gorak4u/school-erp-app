import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      schoolName,
      email,
      phone,
      address,
      city,
      state,
      pinCode,
      adminFirstName,
      adminLastName,
      adminEmail,
      adminPassword,
      plan = 'trial',
    } = body;

    // Validate required fields
    if (!schoolName || !adminEmail || !adminPassword || !adminFirstName || !adminLastName) {
      return NextResponse.json(
        { error: 'Missing required fields: schoolName, adminFirstName, adminLastName, adminEmail, adminPassword' },
        { status: 400 }
      );
    }

    // Check if admin email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Generate slug from school name
    const baseSlug = schoolName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    let slug = baseSlug;
    let slugSuffix = 1;
    while (await prisma.school.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${slugSuffix}`;
      slugSuffix++;
    }

    // Look up the plan config
    const planConfig = await prisma.plan.findUnique({ where: { name: plan } });

    const trialDays = planConfig?.trialDays ?? 30;
    const maxStudents = planConfig?.maxStudents ?? 50;
    const maxTeachers = planConfig?.maxTeachers ?? 5;
    const features = planConfig?.features ?? '["student-management","attendance-tracking","fee-management","basic-reports"]';

    // Hash admin password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create school + subscription + admin user in one transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Create School
      const school = await tx.school.create({
        data: {
          name: schoolName,
          slug,
          email: email || adminEmail,
          phone: phone || null,
          address: address || null,
          city: city || null,
          state: state || null,
          pinCode: pinCode || null,
          isDemo: plan === 'trial',
        },
      });

      // 2. Create Subscription
      const now = new Date();
      const subscriptionData: any = {
        schoolId: school.id,
        plan,
        maxStudents,
        maxTeachers,
        features,
        billingEmail: adminEmail,
      };

      if (plan === 'trial') {
        subscriptionData.status = 'trial';
        subscriptionData.trialEndsAt = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);
      } else {
        subscriptionData.status = 'active';
        subscriptionData.currentPeriodStart = now;
        subscriptionData.currentPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      }

      const subscription = await tx.subscription.create({ data: subscriptionData });

      // 3. Create Admin User
      const user = await tx.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          firstName: adminFirstName,
          lastName: adminLastName,
          role: 'admin',
          schoolId: school.id,
          isActive: true,
        },
      });

      // 4. Create NextAuth Account record
      await tx.account.create({
        data: {
          userId: user.id,
          type: 'credentials',
          provider: 'credentials',
          providerAccountId: user.id,
        },
      });

      return { school, subscription, user };
    });

    return NextResponse.json({
      success: true,
      message: plan === 'trial'
        ? `Trial account created! You have ${trialDays} days to explore.`
        : 'Account created successfully!',
      school: {
        id: result.school.id,
        name: result.school.name,
        slug: result.school.slug,
      },
      user: {
        id: result.user.id,
        email: result.user.email,
        name: `${result.user.firstName} ${result.user.lastName}`,
      },
      subscription: {
        plan: result.subscription.plan,
        status: result.subscription.status,
        trialEndsAt: result.subscription.trialEndsAt,
        maxStudents: result.subscription.maxStudents,
        maxTeachers: result.subscription.maxTeachers,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}
