import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { isSuperAdmin } from '@/lib/superAdmin';

export async function GET() {
  try {
    const plans = await (prisma as any).plan.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json({ plans });
  } catch (error: any) {
    console.error('Plans GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isSuperAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden: Super admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { name, displayName, description, priceMonthly, priceYearly, currency, maxStudents, maxTeachers, features, trialDays, sortOrder } = body;

    if (!name || !displayName) {
      return NextResponse.json({ error: 'name and displayName are required' }, { status: 400 });
    }

    const plan = await (prisma as any).plan.create({
      data: {
        name,
        displayName,
        description: description || '',
        priceMonthly: priceMonthly || 0,
        priceYearly: priceYearly || 0,
        currency: currency || 'INR',
        maxStudents: maxStudents || 50,
        maxTeachers: maxTeachers || 5,
        features: typeof features === 'string' ? features : JSON.stringify(features || []),
        trialDays: trialDays || 0,
        sortOrder: sortOrder || 0,
      },
    });

    return NextResponse.json({ plan });
  } catch (error: any) {
    console.error('Plans POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isSuperAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden: Super admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    if (data.features && typeof data.features !== 'string') {
      data.features = JSON.stringify(data.features);
    }

    const plan = await (prisma as any).plan.update({
      where: { id },
      data,
    });

    return NextResponse.json({ plan });
  } catch (error: any) {
    console.error('Plans PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
