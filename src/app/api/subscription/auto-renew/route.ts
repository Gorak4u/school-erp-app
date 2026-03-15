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

    // First check if subscription exists
    const existingSubscription = await saasPrisma.subscription.findFirst({
      where: {
        schoolId: ctx.schoolId!,
      },
    });

    if (!existingSubscription) {
      return NextResponse.json(
        { error: 'Subscription not found for this school' },
        { status: 404 }
      );
    }

    // Update the subscription
    const subscription = await saasPrisma.subscription.update({
      where: {
        id: existingSubscription.id,
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
    
    // Check if it's a Prisma validation error
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Subscription update conflict. Please try again.' },
        { status: 409 }
      );
    }
    
    // Check if it's a field validation error
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Invalid subscription data. Please contact support.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
