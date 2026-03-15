import { NextRequest, NextResponse } from 'next/server';
import { saasPrisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug SaaS SMTP Settings');

    // Check all SaaS SMTP settings
    const allSaasSmtpSettings = await (saasPrisma as any).SaasSetting.findMany({
      where: { group: 'saas_smtp' }
    });

    console.log('🔍 All SaaS SMTP settings:', allSaasSmtpSettings);

    // Check if there are any SaaS SMTP settings
    const hasSaasSmtp = allSaasSmtpSettings.length > 0;

    const config: Record<string, string> = {};
    for (const s of allSaasSmtpSettings) config[s.key] = s.value;

    return NextResponse.json({
      allSaasSmtpSettings,
      config,
      summary: {
        totalSaasSmtpSettings: allSaasSmtpSettings.length,
        hasSaasSmtpConfig: hasSaasSmtp,
        configuredKeys: Object.keys(config)
      }
    });
  } catch (error: any) {
    console.error('🔍 Debug SaaS SMTP Settings Error:', error);
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
