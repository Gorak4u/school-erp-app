# School ERP SaaS Model Design

## 1. Demo Login & Trial Period

### Demo Access Flow:
1. **Landing Page**: "Try Demo" button
2. **Demo Registration**: Basic info (name, email, school name)
3. **Instant Demo Access**: 30-day trial with pre-populated sample data
4. **Trial Features**: Limited to 50 students, 5 teachers
5. **Auto-Block**: After 30 days, redirect to pricing page

### Implementation:
```typescript
// Demo user creation
const createDemoSchool = async (data: DemoSignupData) => {
  const school = await prisma.school.create({
    data: {
      name: data.schoolName,
      isDemo: true,
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      maxStudents: 50,
      maxTeachers: 5,
      admin: {
        create: {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          role: 'admin',
          password: hashedPassword,
        }
      }
    }
  });
  
  // Create sample data for demo
  await createSampleData(school.id);
  return school;
};
```

## 2. Registration & Subscription Flow

### Registration Options:
1. **Start Free Trial**: 30-day demo with sample data
2. **Subscribe Directly**: Choose plan and start with clean slate
3. **Request Demo**: Schedule a personalized demo

### Registration Process:
```typescript
// /app/api/register/route.ts
export async function POST(req: Request) {
  const { plan, schoolData, paymentMethod } = await req.json();
  
  // Create school
  const school = await prisma.school.create({
    data: {
      ...schoolData,
      subscription: {
        create: {
          plan,
          status: 'active',
          startDate: new Date(),
          endDate: getPlanEndDate(plan),
          paymentMethod,
        }
      }
    }
  });
  
  // Create admin user
  await prisma.user.create({
    data: {
      email: schoolData.adminEmail,
      firstName: schoolData.adminFirstName,
      lastName: schoolData.adminLastName,
      role: 'admin',
      schoolId: school.id,
      password: hashedPassword,
    }
  });
  
  return { success: true, schoolId: school.id };
}
```

## 3. First-Time School Account Creation

### Methods:
1. **Self-Service**: Online registration with immediate access
2. **Assisted**: Sales team creates account for school
3. **Import**: Migrate from existing system

### Self-Service Flow:
1. Choose subscription plan
2. Fill school details
3. Create admin account
4. Payment setup
5. Instant access to dashboard

### Account Structure:
```typescript
// School hierarchy
School {
  id: string
  name: string
  domain: string // optional custom domain
  subscription: Subscription
  settings: SchoolSetting[]
  users: User[]
  academicYears: AcademicYear[]
}

Subscription {
  plan: 'basic' | 'professional' | 'enterprise'
  status: 'active' | 'trial' | 'expired' | 'cancelled'
  maxStudents: number
  maxTeachers: number
  features: string[]
  billing: BillingInfo
}
```

## 4. Subscription Management

### Plans:
1. **Basic** ($49/month):
   - Up to 100 students
   - Up to 10 teachers
   - Core features only
   - Email support

2. **Professional** ($149/month):
   - Up to 500 students
   - Up to 25 teachers
   - All features
   - Priority support
   - API access

3. **Enterprise** (Custom):
   - Unlimited students/teachers
   - Custom features
   - Dedicated support
   - White-label option
   - On-premise option

### Subscription Features:
```typescript
const planFeatures = {
  basic: [
    'student-management',
    'attendance-tracking',
    'fee-management',
    'basic-reports',
    'mobile-app'
  ],
  professional: [
    ...basic,
    'advanced-analytics',
    'timetable-management',
    'exam-management',
    'parent-portal',
    'sms-integration',
    'api-access'
  ],
  enterprise: [
    ...professional,
    'custom-reports',
    'bi-dashboards',
    'hr-management',
    'inventory-management',
    'library-management',
    'white-label',
    'dedicated-support'
  ]
};
```

### Billing System:
```typescript
// Monthly billing check
const processMonthlyBilling = async () => {
  const subscriptions = await prisma.subscription.findMany({
    where: {
      status: 'active',
      nextBillingDate: {
        lte: new Date()
      }
    }
  });
  
  for (const sub of subscriptions) {
    // Charge payment method
    const payment = await chargePayment(sub);
    
    if (payment.success) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          nextBillingDate: addMonths(sub.nextBillingDate, 1),
          lastPaymentAt: new Date()
        }
      });
    } else {
      // Mark as expired after 3 failed attempts
      await handleFailedPayment(sub);
    }
  }
};
```

### Upgrade/Downgrade:
```typescript
export async function changePlan(schoolId: string, newPlan: Plan) {
  const subscription = await prisma.subscription.findUnique({
    where: { schoolId }
  });
  
  // Calculate proration
  const proration = calculateProration(subscription, newPlan);
  
  // Apply new plan
  await prisma.subscription.update({
    where: { schoolId },
    data: {
      plan: newPlan,
      maxStudents: getPlanLimits(newPlan).maxStudents,
      maxTeachers: getPlanLimits(newPlan).maxTeachers,
      features: planFeatures[newPlan],
      nextBillingDate: calculateNextBilling(proration),
    }
  });
  
  // Charge/credit proration amount
  await processProrationPayment(proration);
}
```

## 5. User Management for Schools

### User Roles:
- **Super Admin**: System administrator (your role)
- **School Admin**: School owner/administrator
- **Teacher**: Class teacher, subject teacher
- **Student: Student account
- **Parent**: Parent/guardian account

### User Creation Flow:
```typescript
// Admin adds teacher
const addTeacher = async (schoolId: string, teacherData: TeacherData) => {
  // Check subscription limits
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: { subscription: true, users: true }
  });
  
  const teacherCount = school.users.filter(u => u.role === 'teacher').length;
  if (teacherCount >= school.subscription.maxTeachers) {
    throw new Error('Teacher limit reached. Upgrade your plan.');
  }
  
  // Create teacher
  const teacher = await prisma.user.create({
    data: {
      ...teacherData,
      role: 'teacher',
      schoolId,
      password: generateTempPassword(),
    }
  });
  
  // Send welcome email
  await sendWelcomeEmail(teacher.email, tempPassword);
  return teacher;
};
```

## 6. Trial to Paid Conversion

### Conversion Flow:
1. **Trial Warnings**: Email alerts at 7 days, 3 days, 1 day before expiry
2. **Trial Expired**: Block access, show pricing page
3. **Conversion Offer**: Special discount for trial users
4. **Payment Setup**: Collect payment details
5. **Plan Selection**: Choose appropriate plan based on usage

### Automation:
```typescript
// Daily check for expiring trials
const checkExpiringTrials = async () => {
  const expiringSoon = await prisma.school.findMany({
    where: {
      isDemo: true,
      trialEndsAt: {
        lte: addDays(new Date(), 7),
        gte: new Date()
      }
    }
  });
  
  for (const school of expiringSoon) {
    await sendTrialExpiryEmail(school);
  }
};
```

## Implementation Priority:
1. **Phase 1**: Basic trial system with demo accounts
2. **Phase 2**: Subscription plans and billing
3. **Phase 3**: Automated trial management and conversions
4. **Phase 4**: Advanced features and enterprise options
