import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { saasPrisma } from '@/lib/prisma';
import { isSuperAdmin } from '@/lib/superAdmin';

// SaaS SMTP keys (used for platform emails: password reset, welcome, notifications)
const SAAS_SMTP_KEYS = [
  'smtp_host',
  'smtp_port',
  'smtp_username',
  'smtp_password',
  'smtp_from_email',
  'smtp_from_name',
  'smtp_enabled',
];

// SaaS Payment keys (used for subscription billing)
const SAAS_PAYMENT_KEYS = [
  'razorpay_key_id',
  'razorpay_key_secret',
  'razorpay_webhook_secret',
  'razorpay_enabled',
  'bank_name',
  'bank_account_name',
  'bank_account_number',
  'bank_ifsc_code',
  'bank_branch',
  'bank_upi_id',
  'payment_currency',
  'gst_percentage',
  'gst_number',
  'company_name',
  'company_address',
  'support_email',
  'support_phone',
];

const SAAS_CONFIG_KEYS = [...SAAS_SMTP_KEYS, ...SAAS_PAYMENT_KEYS];

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isSuperAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden: Super admin access required' }, { status: 403 });
    }

    const settings = await (saasPrisma as any).saasSetting.findMany({
      where: { group: { in: ['saas_smtp', 'saas_payment'] } },
    });

    const config: Record<string, string> = {};
    for (const s of settings) {
      config[s.key] = s.value;
    }

    // Mask sensitive values
    const masked = { ...config };
    if (masked.razorpay_key_secret) {
      masked.razorpay_key_secret = masked.razorpay_key_secret.replace(/.(?=.{4})/g, '*');
    }
    if (masked.razorpay_webhook_secret) {
      masked.razorpay_webhook_secret = masked.razorpay_webhook_secret.replace(/.(?=.{4})/g, '*');
    }
    if (masked.bank_account_number) {
      masked.bank_account_number = masked.bank_account_number.replace(/.(?=.{4})/g, '*');
    }

    return NextResponse.json({ config: masked, keys: SAAS_CONFIG_KEYS });
  } catch (error: any) {
    console.error('SaaS config GET error:', error);
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
    const { config } = body;

    if (!config || typeof config !== 'object') {
      return NextResponse.json({ error: 'Invalid config data' }, { status: 400 });
    }

    // Upsert each key into correct group in SaasSetting
    for (const [key, value] of Object.entries(config)) {
      if (!SAAS_CONFIG_KEYS.includes(key)) continue;
      if (typeof value === 'string' && value.includes('****')) continue;

      const group = SAAS_SMTP_KEYS.includes(key) ? 'saas_smtp' : 'saas_payment';

      await (saasPrisma as any).saasSetting.upsert({
        where: { group_key: { group, key } },
        update: { value: String(value) },
        create: { group, key, value: String(value) },
      });
    }

    return NextResponse.json({ success: true, message: 'SaaS payment configuration updated' });
  } catch (error: any) {
    console.error('SaaS config PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
