// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const where: any = {};
    if (!ctx.isSuperAdmin && ctx.schoolId) where.schoolId = ctx.schoolId;

    const discounts = await (schoolPrisma as any).discount.findMany({ where, orderBy: { createdAt: 'desc' } });
    return NextResponse.json({
      discounts: discounts.map(d => ({
        ...d,
        applicableClasses: JSON.parse(d.applicableClasses || '[]'),
        applicableCategories: JSON.parse(d.applicableCategories || '[]'),
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch discounts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { applicableClasses, applicableCategories, ...data } = await request.json();
    const discount = await (schoolPrisma as any).discount.create({
      data: {
        ...data,
        schoolId: ctx.schoolId,
        applicableClasses: JSON.stringify(applicableClasses || []),
        applicableCategories: JSON.stringify(applicableCategories || []),
      },
    });
    return NextResponse.json({
      ...discount,
      applicableClasses: JSON.parse(discount.applicableClasses),
      applicableCategories: JSON.parse(discount.applicableCategories),
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create discount' }, { status: 500 });
  }
}
