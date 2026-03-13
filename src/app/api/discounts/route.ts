// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const discounts = await prisma.discount.findMany({ orderBy: { createdAt: 'desc' } });
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
    const { applicableClasses, applicableCategories, ...data } = await request.json();
    const discount = await prisma.discount.create({
      data: {
        ...data,
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
