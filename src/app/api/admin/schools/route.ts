import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { saasPrisma, schoolPrisma } from '@/lib/prisma';
import { isSuperAdmin } from '@/lib/superAdmin';
import { logAuditAction } from '@/lib/auditLog';
import bcrypt from 'bcryptjs';
import { sendWelcomeEmail } from '@/lib/welcome-email';
import { generateSubdomain, validateSubdomain } from '@/lib/subdomain';

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email || !isSuperAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await req.json();
    const { schoolName, email, phone, city, state, plan, billingCycle, adminFirstName, adminLastName, adminEmail, adminPassword } = data;

    if (!schoolName || !email || !plan || !adminFirstName || !adminLastName || !adminEmail || !adminPassword) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if admin email already exists
    const existingUser = await (schoolPrisma as any).school_User.findUnique({ where: { email: adminEmail } });
    if (existingUser) {
      return NextResponse.json({ error: 'Admin email already exists' }, { status: 400 });
    }

    const p = saasPrisma as any;
    const planConfig = await p.plan.findUnique({ where: { name: plan } });

    // Generate unique slug
    const baseSlug = schoolName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Auto-generate unique domain from school name
    const baseDomain = generateSubdomain(schoolName);
    let domain = baseDomain;
    // Ensure uniqueness by appending a number if taken
    let domainSuffix = 1;
    while (true) {
      const existing = await p.school.findUnique({ where: { domain } });
      if (!existing) break;
      domain = `${baseDomain}-${domainSuffix++}`;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    let createdSchool: any = null;
    let createdUser: any = null;

    // Create School and Subscription first
    createdSchool = await p.school.create({
      data: {
        name: schoolName,
        slug,
        domain,
        email,
        phone: phone || null,
        city: city || null,
        state: state || null,
        isActive: true,
        subscription: {
          create: {
            plan,
            status: 'active',
            maxStudents: planConfig?.maxStudents || 50,
            maxTeachers: planConfig?.maxTeachers || 5,
            features: planConfig?.features || '[]',
            billingCycle: billingCycle || 'monthly',
            price: billingCycle === 'yearly' 
              ? (planConfig?.priceYearly || planConfig?.priceMonthly || 0)
              : (planConfig?.priceMonthly || 0),
            currentPeriodStart: new Date(),
            currentPeriodEnd: plan === 'trial' 
              ? new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)) // 30 days from now for trial
              : new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)) // 1 year from now for paid plans
          }
        }
      },
      include: {
        subscription: true
      }
    });

    // Create Admin User after school is created
    createdUser = await (schoolPrisma as any).school_User.create({
      data: {
        id: 'usr-' + Date.now() + Math.floor(Math.random() * 1000),
        email: adminEmail,
        password: hashedPassword,
        firstName: adminFirstName,
        lastName: adminLastName,
        role: 'admin',
        schoolId: createdSchool.id,
        updatedAt: new Date()
      }
    });

    // Auto-populate school settings from registration data
    try {
      const defaultSettings = [
        { group: 'school_details', key: 'name', value: schoolName },
        { group: 'school_details', key: 'email', value: email },
        { group: 'school_details', key: 'phone', value: phone || '' },
        { group: 'school_details', key: 'city', value: city || '' },
        { group: 'school_details', key: 'state', value: state || '' },
        { group: 'school_details', key: 'address', value: '' },
        { group: 'school_details', key: 'pincode', value: '' },
        { group: 'school_details', key: 'principal', value: `${adminFirstName} ${adminLastName}` },
        { group: 'school_details', key: 'established', value: new Date().getFullYear().toString() },
        { group: 'school_details', key: 'affiliation_no', value: '' },
        { group: 'school_details', key: 'website', value: '' },
      ];

      await Promise.all(
        defaultSettings.map(setting =>
          (schoolPrisma as any).schoolSetting.upsert({
            where: {
              schoolId_group_key: {
                schoolId: createdSchool.id,
                group: setting.group,
                key: setting.key
              }
            },
            update: { value: setting.value },
            create: {
              schoolId: createdSchool.id,
              group: setting.group,
              key: setting.key,
              value: setting.value,
            }
          })
        )
      );

      console.log(`✅ Auto-populated school settings for ${schoolName}`);
    } catch (settingsError) {
      console.error('Failed to auto-populate school settings:', settingsError);
      // Don't fail the entire registration if settings creation fails
    }

    // Send welcome email with login credentials
    if (createdSchool && createdUser) {
      try {
        await sendWelcomeEmail(
          createdUser,
          createdSchool,
          createdSchool.subscription,
          adminPassword, // Pass plain text password to be included in email
          createdSchool.subscription.currentPeriodStart || undefined,
          createdSchool.subscription.currentPeriodEnd || undefined
        );
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // We don't throw here so the API still returns success for school creation
      }
    }

    await logAuditAction({ 
      actorEmail: session.user.email, 
      action: 'create_school', 
      target: createdSchool.id, 
      targetName: schoolName, 
      details: { adminEmail, plan } 
    });

    return NextResponse.json({ success: true, message: 'School and Admin user created successfully', school: createdSchool });
  } catch (error: any) {
    console.error('Error creating school:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email || !isSuperAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status'); // active, trial, expired, blocked
    const search = searchParams.get('search');
    const plan = searchParams.get('plan');
    const includeCounts = searchParams.get('includeCounts') !== 'false'; // Default: true

    // Build where clause
    const whereClause: any = {};
    if (status && status !== 'all') {
      if (status === 'active') {
        whereClause.isActive = true;
      } else if (status === 'blocked') {
        whereClause.isActive = false;
      } else if (status === 'trial') {
        whereClause.subscription = { status: 'trial' };
      } else if (status === 'expired') {
        whereClause.subscription = { status: 'expired' };
      }
    }
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (plan && plan !== 'all') {
      whereClause.subscription = { plan };
    }

    // Get total count for pagination
    const total = await (saasPrisma as any).school.count({ where: whereClause });

    // Get paginated schools
    const schools = await (saasPrisma as any).school.findMany({
      where: whereClause,
      include: {
        subscription: true,
        _count: { select: { User: true } }, // Only User is in same schema
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Optimize counts - only get when requested and use batch queries
    let schoolsWithCounts = schools;
    if (includeCounts && schools.length > 0) {
      // Batch count queries instead of N+1
      const schoolIds = schools.map((s: any) => s.id);
      const studentCounts = await (schoolPrisma as any).student.groupBy({
        by: ['schoolId'],
        where: { schoolId: { in: schoolIds } },
        _count: true,
      });
      
      const teacherCounts = await (schoolPrisma as any).teacher.groupBy({
        by: ['schoolId'],
        where: { schoolId: { in: schoolIds } },
        _count: true,
      });
      
      // Map counts back to schools
      const studentCountMap = Object.fromEntries(
        studentCounts.map((c: any) => [c.schoolId, c._count])
      );
      const teacherCountMap = Object.fromEntries(
        teacherCounts.map((c: any) => [c.schoolId, c._count])
      );
      
      schoolsWithCounts = schools.map((school: any) => ({
        ...school,
        _count: {
          ...school._count,
          students: studentCountMap[school.id] || 0,
          teachers: teacherCountMap[school.id] || 0,
        },
      }));
    }

    return NextResponse.json({
      schools: schoolsWithCounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email || !isSuperAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id, action, ...data } = await req.json();
    if (!id) return NextResponse.json({ error: 'School ID required' }, { status: 400 });

    const p = saasPrisma as any;

    const school = await p.school.findUnique({ where: { id }, select: { name: true } });
    const schoolName = school?.name || id;

    if (action === 'update_subdomain') {
      const newDomain = (data.subdomain || '').toLowerCase().trim();
      const validation = validateSubdomain(newDomain);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
      const conflict = await p.school.findUnique({ where: { domain: newDomain } });
      if (conflict && conflict.id !== id) {
        return NextResponse.json({ error: 'Subdomain already taken' }, { status: 409 });
      }
      await p.school.update({ where: { id }, data: { domain: newDomain } });
      await logAuditAction({ actorEmail: session.user.email, action: 'update_subdomain', target: id, targetName: schoolName, details: { subdomain: newDomain } });
      return NextResponse.json({ success: true, message: 'Subdomain updated', subdomain: newDomain });
    }
    if (action === 'block') {
      await p.school.update({ where: { id }, data: { isActive: false } });
      await logAuditAction({ actorEmail: session.user.email, action: 'block_school', target: id, targetName: schoolName });
      return NextResponse.json({ success: true, message: 'School blocked' });
    }
    if (action === 'unblock') {
      await p.school.update({ where: { id }, data: { isActive: true } });
      await logAuditAction({ actorEmail: session.user.email, action: 'unblock_school', target: id, targetName: schoolName });
      return NextResponse.json({ success: true, message: 'School unblocked' });
    }
    if (action === 'extend_trial') {
      const days = data.days || 30;
      const sub = await p.subscription.findUnique({ where: { schoolId: id } });
      if (sub) {
        const currentEnd = sub.trialEndsAt ? new Date(sub.trialEndsAt) : new Date();
        const newEnd = new Date(currentEnd.getTime() + days * 24 * 60 * 60 * 1000);
        await p.subscription.update({ where: { schoolId: id }, data: { trialEndsAt: newEnd, status: 'trial' } });
        await logAuditAction({ actorEmail: session.user.email, action: 'extend_trial', target: id, targetName: schoolName, details: { days } });
        return NextResponse.json({ success: true, message: `Trial extended by ${days} days` });
      }
    }
    if (action === 'change_plan') {
      const { plan, maxStudents, maxTeachers, billingCycle } = data;
      // Look up plan defaults from DB
      const planConfig = await p.plan.findUnique({ where: { name: plan } });
      
      // Calculate pricing based on billing cycle
      let price = planConfig?.priceMonthly || 0;
      if (billingCycle === 'yearly') {
        price = planConfig?.priceYearly || planConfig?.priceMonthly || 0;
      }
      
      await p.subscription.update({
        where: { schoolId: id },
        data: {
          plan,
          status: 'active',
          maxStudents: maxStudents || planConfig?.maxStudents || 50,
          maxTeachers: maxTeachers || planConfig?.maxTeachers || 5,
          features: planConfig?.features || '[]',
          billingCycle: billingCycle || 'monthly',
          price,
        },
      });
      await logAuditAction({ actorEmail: session.user.email, action: 'change_plan', target: id, targetName: schoolName, details: { plan, billingCycle: billingCycle || 'monthly' } });
      return NextResponse.json({ success: true, message: `Plan changed to ${plan} (${billingCycle || 'monthly'})` });
    }
    if (action === 'bulk_block') {
      const { ids } = data;
      await p.school.updateMany({ where: { id: { in: ids } }, data: { isActive: false } });
      await logAuditAction({ actorEmail: session.user.email, action: 'bulk_block_schools', details: { count: ids.length } });
      return NextResponse.json({ success: true, message: `${ids.length} schools blocked` });
    }
    if (action === 'bulk_unblock') {
      const { ids } = data;
      await p.school.updateMany({ where: { id: { in: ids } }, data: { isActive: true } });
      await logAuditAction({ actorEmail: session.user.email, action: 'bulk_unblock_schools', details: { count: ids.length } });
      return NextResponse.json({ success: true, message: `${ids.length} schools unblocked` });
    }
    if (action === 'bulk_change_plan') {
      const { ids, plan, billingCycle } = data;
      const planConfig = await p.plan.findUnique({ where: { name: plan } });
      
      // Calculate pricing based on billing cycle
      let price = planConfig?.priceMonthly || 0;
      if (billingCycle === 'yearly') {
        price = planConfig?.priceYearly || planConfig?.priceMonthly || 0;
      }
      
      for (const sid of ids) {
        await p.subscription.updateMany({
          where: { schoolId: sid },
          data: {
            plan,
            status: 'active',
            maxStudents: planConfig?.maxStudents || 50,
            maxTeachers: planConfig?.maxTeachers || 5,
            billingCycle: billingCycle || 'monthly',
            price,
          },
        });
      }
      await logAuditAction({ actorEmail: session.user.email, action: 'bulk_change_plan', details: { count: ids.length, plan, billingCycle: billingCycle || 'monthly' } });
      return NextResponse.json({ success: true, message: `Plan changed to ${plan} (${billingCycle || 'monthly'}) for ${ids.length} schools` });
    }

    if (action === 'delete') {
      // Delete school and all related data
      await p.$transaction(async (tx: any) => {
        // 1. Delete all students for this school
        await (schoolPrisma as any).student.deleteMany({ where: { schoolId: id } });
        
        // 2. Delete all teachers for this school
        await (schoolPrisma as any).teacher.deleteMany({ where: { schoolId: id } });
        
        // 3. Delete all users for this school
        await (schoolPrisma as any).school_User.deleteMany({ where: { schoolId: id } });
        
        // 4. Delete subscription
        await tx.subscription.delete({ where: { schoolId: id } });
        
        // 5. Delete the school
        await tx.school.delete({ where: { id } });
      });
      
      await logAuditAction({ actorEmail: session.user.email, action: 'delete_school', target: id, targetName: schoolName });
      return NextResponse.json({ success: true, message: 'School and all related data deleted successfully' });
    }
    
    if (action === 'bulk_delete') {
      const { ids } = data;
      await p.$transaction(async (tx: any) => {
        for (const schoolId of ids) {
          const school = await tx.school.findUnique({ where: { id: schoolId }, select: { name: true } });
          const name = school?.name || schoolId;
          
          // Delete all students for this school
          await (schoolPrisma as any).student.deleteMany({ where: { schoolId } });
          
          // Delete all teachers for this school
          await (schoolPrisma as any).teacher.deleteMany({ where: { schoolId } });
          
          // Delete all users for this school
          await (schoolPrisma as any).school_User.deleteMany({ where: { schoolId } });
          
          // Delete subscription
          await tx.subscription.delete({ where: { schoolId } });
          
          // Delete the school
          await tx.school.delete({ where: { id: schoolId } });
        }
      });
      
      await logAuditAction({ actorEmail: session.user.email, action: 'bulk_delete_schools', details: { count: ids.length } });
      return NextResponse.json({ success: true, message: `${ids.length} schools and all their related data deleted successfully` });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
