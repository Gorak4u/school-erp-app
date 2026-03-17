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

// Helper function to get value from .env or database
async function getConfigValue(key: string, dbSettings: any[]): Promise<string> {
  // First check if it exists in .env file
  const envValue = process.env[key.toUpperCase()];
  if (envValue) {
    return envValue;
  }
  
  // Fall back to database value
  const dbSetting = dbSettings.find(s => s.key === key);
  return dbSetting?.value || '';
}

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
    const source: Record<string, 'env' | 'db'> = {};
    
    // Get values from .env first, then database
    for (const key of SAAS_CONFIG_KEYS) {
      const value = await getConfigValue(key, settings);
      config[key] = value;
      
      // Track source for UI indication
      const envValue = process.env[key.toUpperCase()];
      source[key] = envValue ? 'env' : 'db';
    }

    // Mask sensitive values
    const masked = { ...config };
    if (masked.razorpay_key_secret && !process.env.RAZORPAY_KEY_SECRET) {
      masked.razorpay_key_secret = masked.razorpay_key_secret.replace(/.(?=.{4})/g, '*');
    }
    if (masked.razorpay_webhook_secret && !process.env.RAZORPAY_WEBHOOK_SECRET) {
      masked.razorpay_webhook_secret = masked.razorpay_webhook_secret.replace(/.(?=.{4})/g, '*');
    }
    if (masked.bank_account_number && !process.env.BANK_ACCOUNT_NUMBER) {
      masked.bank_account_number = masked.bank_account_number.replace(/.(?=.{4})/g, '*');
    }
    if (masked.smtp_password && !process.env.SMTP_PASSWORD) {
      masked.smtp_password = masked.smtp_password.replace(/.(?=.{4})/g, '*');
    }

    return NextResponse.json({ 
      config: masked, 
      source,
      keys: SAAS_CONFIG_KEYS,
      envDefaults: SAAS_CONFIG_KEYS.reduce((acc, key) => {
        const envValue = process.env[key.toUpperCase()];
        if (envValue) acc[key] = envValue;
        return acc;
      }, {} as Record<string, string>)
    });
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

      // Don't save to database if it matches .env value (to avoid redundancy)
      const envValue = process.env[key.toUpperCase()];
      if (envValue && String(value) === envValue) {
        // Remove from database if it exists and matches .env
        const group = SAAS_SMTP_KEYS.includes(key) ? 'saas_smtp' : 'saas_payment';
        await (saasPrisma as any).saasSetting.deleteMany({
          where: { group, key }
        });
        continue;
      }

      const group = SAAS_SMTP_KEYS.includes(key) ? 'saas_smtp' : 'saas_payment';

      await (saasPrisma as any).saasSetting.upsert({
        where: { group_key: { group, key } },
        update: { value: String(value) },
        create: { group, key, value: String(value) },
      });
    }

    return NextResponse.json({ success: true, message: 'SaaS configuration updated' });
  } catch (error: any) {
    console.error('SaaS config PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
