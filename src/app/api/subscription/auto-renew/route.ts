import { NextRequest, NextResponse } from 'next/server';
import { saasPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

export async function POST(req: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { autoRenew } = await req.json();

    if (typeof autoRenew !== 'boolean') {
      return NextResponse.json(
        { error: 'autoRenew must be a boolean' },
        { status: 400 }
      );
    }

    const subscription = await saasPrisma.subscription.update({
      where: {
        schoolId: ctx.schoolId!,
      },
      data: {
        autoRenew,
      },
    });

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        autoRenew: subscription.autoRenew,
      },
    });
  } catch (error: any) {
    console.error('Failed to update subscription auto-renewal:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
