import { POST } from '@/app/api/register/route';
import { NextResponse } from 'next/server';

jest.mock('@/lib/prisma', () => {
  const mockSchoolUserFindUnique = jest.fn();
  const mockSchoolFindUnique = jest.fn();
  const mockPlanFindUnique = jest.fn();
  const mockTransaction = jest.fn();

  const mocks = {
    mockSchoolUserFindUnique,
    mockSchoolFindUnique,
    mockPlanFindUnique,
    mockTransaction,
  };

  return {
    __esModule: true,
    saasPrisma: {
      plan: { findUnique: mockPlanFindUnique },
    },
    schoolPrisma: {
      school_User: { findUnique: mockSchoolUserFindUnique },
      school: { findUnique: mockSchoolFindUnique },
      $transaction: mockTransaction,
    },
    prismaMocks: mocks,
  };
});

jest.mock('@/lib/welcome-email', () => ({
  sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
}));

describe('POST /api/register', () => {
  const { prismaMocks } = jest.requireMock('@/lib/prisma');
  const mockPlan = prismaMocks.mockPlanFindUnique as jest.Mock;
  const mockSchoolUserFindUnique = prismaMocks.mockSchoolUserFindUnique as jest.Mock;
  const mockSchoolFindUnique = prismaMocks.mockSchoolFindUnique as jest.Mock;
  const mockTransaction = prismaMocks.mockTransaction as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSchoolFindUnique.mockResolvedValue(null);
    mockPlan.mockResolvedValue({
      trialDays: 14,
      maxStudents: 100,
      maxTeachers: 10,
      features: '[]',
      priceMonthly: 0,
    });
  });

  it('returns 400 when required fields are missing', async () => {
    const req = new Request('http://localhost/api/register', {
      method: 'POST',
      body: JSON.stringify({ schoolName: 'Test School' }),
    });

    const res = (await POST(req)) as NextResponse;
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Missing required fields/i);
  });

  it('returns ACCOUNT_PENDING_PAYMENT when existing user has pending payment', async () => {
    mockSchoolUserFindUnique.mockResolvedValue({
      email: 'admin@test.com',
      schoolId: 'school_1',
      School: { subscription: { status: 'pending_payment' } },
    });

    const req = new Request('http://localhost/api/register', {
      method: 'POST',
      body: JSON.stringify({
        schoolName: 'Test School',
        adminFirstName: 'Admin',
        adminLastName: 'User',
        adminEmail: 'admin@test.com',
        adminPassword: 'password123',
      }),
    });

    const res = (await POST(req)) as NextResponse;
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe('ACCOUNT_PENDING_PAYMENT');
  });

  it('creates trial registration successfully', async () => {
    mockSchoolUserFindUnique.mockResolvedValue(null);

    const mockSchool = {
      id: 'school_1',
      name: 'Test School',
      slug: 'test-school',
      domain: null,
    };

    const mockSubscription = {
      plan: 'trial',
      status: 'trial',
      trialEndsAt: new Date().toISOString(),
      maxStudents: 100,
      maxTeachers: 10,
    };

    const mockUser = {
      id: 'user_1',
      email: 'admin@test.com',
      firstName: 'Admin',
      lastName: 'User',
    };

    mockTransaction.mockImplementation(async (callback: any) => {
      const tx = {
        school: { create: jest.fn().mockResolvedValue(mockSchool) },
        subscription: { create: jest.fn().mockResolvedValue(mockSubscription) },
        school_User: { create: jest.fn().mockResolvedValue(mockUser) },
        account: { create: jest.fn().mockResolvedValue({}) },
      };
      return callback(tx);
    });

    const req = new Request('http://localhost/api/register', {
      method: 'POST',
      body: JSON.stringify({
        schoolName: 'Test School',
        adminFirstName: 'Admin',
        adminLastName: 'User',
        adminEmail: 'admin@test.com',
        adminPassword: 'password123',
        plan: 'trial',
      }),
    });

    const res = (await POST(req)) as NextResponse;
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.school.id).toBe(mockSchool.id);
    expect(mockPlan).toHaveBeenCalled();
    expect(mockTransaction).toHaveBeenCalled();
  });
});
