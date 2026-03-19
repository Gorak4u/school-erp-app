import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { saasPrisma } from '@/lib/prisma';
import { isSuperAdmin } from '@/lib/superAdmin';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email || !isSuperAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const promoCodes = await saasPrisma.promoCode.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { subscriptionPromos: true }
        }
      }
    });

    // Add usage stats to each promo code
    const promoCodesWithStats = promoCodes.map(code => ({
      ...code,
      usageCount: code._count.subscriptionPromos,
      isExhausted: code.usageLimit ? code._count.subscriptionPromos >= code.usageLimit : false,
      isExpired: new Date(code.validTo) < new Date(),
    }));

    return NextResponse.json({ promoCodes: promoCodesWithStats });
  } catch (error: any) {
    console.error('Promo codes GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email || !isSuperAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      code,
      description,
      discountType,
      discountValue,
      maxDiscountAmount,
      applicablePlans,
      usageLimit,
      validFrom,
      validTo
    } = body;

    // Validation
    if (!code || !discountType || !discountValue || !validFrom || !validTo) {
      return NextResponse.json({
        error: 'Missing required fields: code, discountType, discountValue, validFrom, validTo'
      }, { status: 400 });
    }

    if (!['percentage', 'fixed'].includes(discountType)) {
      return NextResponse.json({ error: 'discountType must be "percentage" or "fixed"' }, { status: 400 });
    }

    if (discountType === 'percentage' && (discountValue <= 0 || discountValue > 100)) {
      return NextResponse.json({ error: 'Percentage discount must be between 1-100' }, { status: 400 });
    }

    if (discountType === 'fixed' && discountValue <= 0) {
      return NextResponse.json({ error: 'Fixed discount must be greater than 0' }, { status: 400 });
    }

    // Check for duplicate code
    const existingCode = await saasPrisma.promoCode.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (existingCode) {
      return NextResponse.json({ error: 'Promo code already exists' }, { status: 400 });
    }

    // Validate date range
    const fromDate = new Date(validFrom);
    const toDate = new Date(validTo);

    if (fromDate >= toDate) {
      return NextResponse.json({ error: 'validFrom must be before validTo' }, { status: 400 });
    }

    // Validate applicable plans format
    let plansJson: string;
    if (applicablePlans === 'all') {
      plansJson = 'all';
    } else if (Array.isArray(applicablePlans)) {
      plansJson = JSON.stringify(applicablePlans);
    } else {
      return NextResponse.json({ error: 'applicablePlans must be "all" or an array of plan names' }, { status: 400 });
    }

    const promoCode = await saasPrisma.promoCode.create({
      data: {
        code: code.toUpperCase(),
        description,
        discountType,
        discountValue: parseFloat(discountValue),
        maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
        applicablePlans: plansJson,
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        validFrom: fromDate,
        validTo: toDate,
        createdBy: session.user.email,
      },
    });

    return NextResponse.json({ promoCode });
  } catch (error: any) {
    console.error('Promo codes POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email || !isSuperAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'Promo code ID is required' }, { status: 400 });
    }

    // Validate discount type if provided
    if (data.discountType && !['percentage', 'fixed'].includes(data.discountType)) {
      return NextResponse.json({ error: 'discountType must be "percentage" or "fixed"' }, { status: 400 });
    }

    // Validate discount value if provided
    if (data.discountValue !== undefined) {
      if (data.discountType === 'percentage' && (data.discountValue <= 0 || data.discountValue > 100)) {
        return NextResponse.json({ error: 'Percentage discount must be between 1-100' }, { status: 400 });
      }
      if (data.discountType === 'fixed' && data.discountValue <= 0) {
        return NextResponse.json({ error: 'Fixed discount must be greater than 0' }, { status: 400 });
      }
    }

    // Validate date range if dates are provided
    if (data.validFrom && data.validTo) {
      const fromDate = new Date(data.validFrom);
      const toDate = new Date(data.validTo);
      if (fromDate >= toDate) {
        return NextResponse.json({ error: 'validFrom must be before validTo' }, { status: 400 });
      }
    }

    // Convert applicable plans if provided
    if (data.applicablePlans) {
      if (data.applicablePlans === 'all') {
        data.applicablePlans = 'all';
      } else if (Array.isArray(data.applicablePlans)) {
        data.applicablePlans = JSON.stringify(data.applicablePlans);
      } else {
        return NextResponse.json({ error: 'applicablePlans must be "all" or an array of plan names' }, { status: 400 });
      }
    }

    // Convert numeric fields
    if (data.discountValue !== undefined) {
      data.discountValue = parseFloat(data.discountValue);
    }
    if (data.maxDiscountAmount !== undefined) {
      data.maxDiscountAmount = data.maxDiscountAmount ? parseFloat(data.maxDiscountAmount) : null;
    }
    if (data.usageLimit !== undefined) {
      data.usageLimit = data.usageLimit ? parseInt(data.usageLimit) : null;
    }

    const promoCode = await saasPrisma.promoCode.update({
      where: { id },
      data,
    });

    return NextResponse.json({ promoCode });
  } catch (error: any) {
    console.error('Promo codes PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email || !isSuperAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Promo code ID is required' }, { status: 400 });
    }

    // Check if promo code is being used
    const usageCount = await saasPrisma.subscriptionPromo.count({
      where: { promoCodeId: id }
    });

    if (usageCount > 0) {
      return NextResponse.json({
        error: 'Cannot delete promo code',
        details: `Used by ${usageCount} subscription(s)`,
        code: 'IN_USE'
      }, { status: 400 });
    }

    await saasPrisma.promoCode.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Promo codes DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
