import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { saasPrisma } from '@/lib/prisma';

// Public endpoint to check if payment system is configured
// Accessible by all authenticated users (school admins can check payment status)
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get SaaS payment configuration
    const settings = await (saasPrisma as any).SaasSetting.findMany({
      where: { group: 'saas_payment' },
    });

    const config: Record<string, string> = {};
    for (const setting of settings) {
      config[setting.key] = setting.value;
    }

    // Check if Razorpay is configured (don't expose actual secrets)
    const hasRazorpayConfig = config.razorpay_key_id && config.razorpay_key_secret && config.razorpay_enabled !== 'false';
    
    // Also check if Razorpay is enabled
    const isRazorpayEnabled = config.razorpay_enabled === 'true';

    return NextResponse.json({
      success: true,
      hasPaymentConfig: hasRazorpayConfig,
      isPaymentEnabled: isRazorpayEnabled,
      paymentProvider: 'razorpay',
      currency: config.payment_currency || 'INR',
      // Don't expose actual keys, just whether they exist
      hasKeyId: !!config.razorpay_key_id,
      hasKeySecret: !!config.razorpay_key_secret,
    });

  } catch (error: any) {
    console.error('Payment config check error:', error);
    return NextResponse.json({ 
      error: 'Failed to check payment configuration',
      hasPaymentConfig: false,
      isPaymentEnabled: false 
    }, { status: 500 });
  }
}
