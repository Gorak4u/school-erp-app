import { NextRequest, NextResponse } from 'next/server';
import { getReminderConfig, updateReminderConfig } from '@/lib/reminder-config';

export async function GET() {
  try {
    const config = await getReminderConfig();
    
    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error: any) {
    console.error('Failed to fetch reminder config:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch reminder configuration' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { config } = body;

    if (!config) {
      return NextResponse.json(
        { error: 'Configuration data is required' },
        { status: 400 }
      );
    }

    // Validate configuration structure
    const allowedKeys = ['trialExpiry', 'subscriptionRenewal', 'paymentFailed', 'serviceSuspension', 'quotaLimitExceeded'];
    const configKeys = Object.keys(config);
    
    for (const key of configKeys) {
      if (!allowedKeys.includes(key)) {
        return NextResponse.json(
          { error: `Invalid configuration key: ${key}` },
          { status: 400 }
        );
      }
    }

    // Validate each configuration section
    for (const [key, value] of Object.entries(config)) {
      const section = value as any;
      
      if (typeof section.enabled !== 'boolean') {
        return NextResponse.json(
          { error: `${key}.enabled must be a boolean` },
          { status: 400 }
        );
      }
      
      if (!Array.isArray(section.daysBefore)) {
        return NextResponse.json(
          { error: `${key}.daysBefore must be an array` },
          { status: 400 }
        );
      }
      
      if (!section.timeOfDay || typeof section.timeOfDay !== 'string') {
        return NextResponse.json(
          { error: `${key}.timeOfDay must be a valid time string` },
          { status: 400 }
        );
      }
      
      if (!section.timezone || typeof section.timezone !== 'string') {
        return NextResponse.json(
          { error: `${key}.timezone must be a valid timezone string` },
          { status: 400 }
        );
      }
      
      if (!section.subject || typeof section.subject !== 'string') {
        return NextResponse.json(
          { error: `${key}.subject must be a string` },
          { status: 400 }
        );
      }
    }

    await updateReminderConfig(config);

    return NextResponse.json({
      success: true,
      message: 'Reminder configuration updated successfully',
    });
  } catch (error: any) {
    console.error('Failed to update reminder config:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update reminder configuration' },
      { status: 500 }
    );
  }
}
