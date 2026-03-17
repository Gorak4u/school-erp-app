import { NextResponse } from 'next/server';
import { saasPrisma, schoolPrisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { sendWelcomeEmail } from '@/lib/welcome-email';
import { generateSubdomain, validateSubdomain } from '@/lib/subdomain';

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
      billingCycle = 'monthly',
    } = body;

    // Validate required fields
    if (!schoolName || !adminEmail || !adminPassword || !adminFirstName || !adminLastName) {
      return NextResponse.json(
        { error: 'Missing required fields: schoolName, adminFirstName, adminLastName, adminEmail, adminPassword' },
        { status: 400 }
      );
    }

    // Check if admin email already exists
    const existingUser = await (schoolPrisma as any).school_User.findUnique({
      where: { email: adminEmail },
      include: { 
        School: { 
          include: { 
            subscription: true 
          } 
        } 
      },
    });
    
    if (existingUser) {
      console.log('Existing user found:', existingUser.email);
      console.log('School subscription:', existingUser.School?.subscription);
      console.log('Subscription status:', existingUser.School?.subscription?.status);
      
      // Check if user has pending payment subscription
      if (existingUser.School?.subscription?.status === 'pending_payment') {
        console.log('Detected pending payment status, returning ACCOUNT_PENDING_PAYMENT');
        return NextResponse.json({
          error: 'ACCOUNT_PENDING_PAYMENT',
          message: 'You have an incomplete registration. Please complete your payment to continue.',
          schoolId: existingUser.schoolId,
          redirectUrl: '/subscription-required?pending=true'
        }, { status: 409 });
      }
      
      console.log('No pending payment detected, returning regular error');
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
    while (await (schoolPrisma as any).school.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${slugSuffix}`;
      slugSuffix++;
    }

    // Look up the plan config
    const planConfig = await (saasPrisma as any).plan.findUnique({ where: { name: plan } });

    const trialDays = planConfig?.trialDays ?? 30;
    const maxStudents = planConfig?.maxStudents ?? 50;
    const maxTeachers = planConfig?.maxTeachers ?? 5;
    const features = planConfig?.features ?? '["student-management","attendance-tracking","fee-management","basic-reports"]';

    // Determine if this is a free/trial plan by price (not by name)
    const isTrialPlan = (planConfig?.priceMonthly ?? 0) === 0;

    // Only generate domain for paid plans (not trial users)
    let domain = null;
    if (!isTrialPlan) {
      // Auto-generate unique domain from school name
      const baseDomain = generateSubdomain(schoolName);
      domain = baseDomain;
      // Ensure uniqueness by appending a number if taken
      let domainSuffix = 1;
      while (true) {
        const existing = await (saasPrisma as any).school.findUnique({ where: { domain } });
        if (!existing) break;
        domain = `${baseDomain}-${domainSuffix++}`;
      }
    }

    // Calculate price based on billing cycle
    const price = billingCycle === 'yearly'
      ? (planConfig?.priceYearly || planConfig?.priceMonthly || 0)
      : (planConfig?.priceMonthly || 0);

    // Hash admin password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create school + subscription + admin user in one transaction
    const result = await (schoolPrisma as any).$transaction(async (tx: any) => {
      // 1. Create School
      const school = await tx.school.create({
        data: {
          name: schoolName,
          slug,
          domain, // Add auto-generated domain
          email: email || adminEmail,
          phone: phone || null,
          address: address || null,
          city: city || null,
          state: state || null,
          pinCode: pinCode || null,
          isDemo: isTrialPlan,
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
        billingCycle,
        price,
      };

      if (isTrialPlan) {
        subscriptionData.status = 'trial';
        subscriptionData.trialEndsAt = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);
      } else {
        // Paid plans start as pending_payment until payment is verified
        subscriptionData.status = 'pending_payment';
        subscriptionData.currentPeriodStart = null;
        subscriptionData.currentPeriodEnd = null;
      }

      const subscription = await tx.subscription.create({ data: subscriptionData });

      // 3. Create Admin school_User (inactive for paid plans until payment confirmed)
      const user = await (tx as any).school_User.create({
        data: {
          id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          email: adminEmail,
          password: hashedPassword,
          firstName: adminFirstName,
          lastName: adminLastName,
          role: 'admin',
          schoolId: school.id,
          isActive: true, // Allow all users to log in (middleware will restrict access)
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // 4. Create NextAuth Account record
      await (tx as any).account.create({
        data: {
          id: `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: user.id,
          type: 'credentials',
          provider: 'credentials',
          providerAccountId: user.id,
        },
      });

      return { school, subscription, user };
    });

    // Send welcome email (non-blocking)
    sendWelcomeEmail(result.user, result.school, result.subscription).catch(error => {
      console.error('Welcome email failed:', error);
    });

    return NextResponse.json({
      success: true,
      message: isTrialPlan
        ? `Trial account created! You have ${trialDays} days to explore. Upgrade to a paid plan to get a custom domain (yourname.schoolerp.com).`
        : 'Account created successfully! Your custom domain will be ready shortly.',
      school: {
        id: result.school.id,
        name: result.school.name,
        slug: result.school.slug,
        domain: result.school.domain, // Will be null for trial users
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
