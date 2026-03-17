import { POST } from '@/app/api/verify-payment/route';
import { NextResponse } from 'next/server';

jest.mock('@/lib/prisma', () => {
  const mockTransaction = jest.fn();
  const mockSubscriptionPaymentFindFirst = jest.fn();
  const mockSchoolUserUpdateMany = jest.fn();

  return {
    __esModule: true,
    saasPrisma: {
      $transaction: mockTransaction,
      subscriptionPayment: {
        findFirst: mockSubscriptionPaymentFindFirst,
      },
    },
    schoolPrisma: {
      school_User: {
        updateMany: mockSchoolUserUpdateMany,
      },
    },
    prismaMocks: {
      mockTransaction,
      mockSubscriptionPaymentFindFirst,
      mockSchoolUserUpdateMany,
    },
  };
});

jest.mock('@/lib/payment-confirmation-email', () => ({
  sendPaymentConfirmationEmail: jest.fn().mockResolvedValue(undefined),
}));

describe('POST /api/verify-payment', () => {
  const { prismaMocks } = jest.requireMock('@/lib/prisma');
  const mockTransaction = prismaMocks.mockTransaction as jest.Mock;
  const mockSubscriptionPaymentFindFirst = prismaMocks.mockSubscriptionPaymentFindFirst as jest.Mock;
  const mockSchoolUserUpdateMany = prismaMocks.mockSchoolUserUpdateMany as jest.Mock;
  const { sendPaymentConfirmationEmail } = jest.requireMock('@/lib/payment-confirmation-email');

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.RAZORPAY_KEY_SECRET = 'secret';
  });

  it('returns 400 when required fields are missing', async () => {
    const req = new Request('http://localhost/api/verify-payment', {
      method: 'POST',
      body: JSON.stringify({ schoolId: 'school_1' }),
    });

    const res = (await POST(req)) as NextResponse;
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Missing required fields/i);
  });

  it('fails when payment signature is invalid', async () => {
    const req = new Request('http://localhost/api/verify-payment', {
      method: 'POST',
      body: JSON.stringify({
        schoolId: 'school_1',
        paymentId: 'pay_123',
        orderId: 'order_123',
        signature: 'bad-signature',
      }),
    });

    const res = (await POST(req)) as NextResponse;
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid payment signature');
  });

  it('verifies payment and activates subscription', async () => {
    const signaturePayload = 'order_123|pay_123';
    const crypto = await import('crypto');
    const expectedSignature = crypto.createHmac('sha256', 'secret').update(signaturePayload).digest('hex');

    const mockSchool = {
      id: 'school_1',
      subscription: {
        id: 'sub_1',
        status: 'pending_payment',
        currentPeriodEnd: null,
      },
      User: [
        { role: 'admin', email: 'admin@test.com' },
      ],
    };

    const mockSubscription = {
      id: 'sub_1',
      status: 'active',
      currentPeriodEnd: new Date().toISOString(),
    };

    mockSubscriptionPaymentFindFirst.mockResolvedValue({ amount: 9999 });

    mockTransaction.mockImplementation(async (callback: any) => {
      const tx = {
        school: {
          findUnique: jest.fn().mockResolvedValue(mockSchool),
        },
        subscription: {
          update: jest.fn().mockResolvedValue(mockSubscription),
        },
        subscriptionPayment: {
          updateMany: jest.fn().mockResolvedValue(undefined),
        },
      };
      return callback(tx);
    });

    const req = new Request('http://localhost/api/verify-payment', {
      method: 'POST',
      body: JSON.stringify({
        schoolId: mockSchool.id,
        paymentId: 'pay_123',
        orderId: 'order_123',
        signature: expectedSignature,
        billingCycle: 'monthly',
      }),
    });

    const res = (await POST(req)) as NextResponse;
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.subscription.status).toBe('active');
    expect(mockSchoolUserUpdateMany).toHaveBeenCalledWith({ where: { schoolId: mockSchool.id }, data: { isActive: true } });
    expect(sendPaymentConfirmationEmail).toHaveBeenCalled();
  });
});
