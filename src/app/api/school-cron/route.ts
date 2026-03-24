import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { schoolPrisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

/**
 * School-specific Cron Job Management API
 * GET - Get school's cron job configurations
 * POST - Update school's cron job configurations
 */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin or manage_settings permission
    const canManage = await hasPermission(session.user.email, 'manage_settings');
    if (!canManage) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Return default cron configurations (controlled by super admin)
    const defaultConfigs = [
      {
        name: 'process-communication-outbox',
        schedule: '*/5 * * * *',
        enabled: true,
        description: 'Process pending communication outbox emails and notifications',
        category: 'communication',
        priority: 1
      },
      {
        name: 'send-reminders',
        schedule: '0 9 * * *',
        enabled: true,
        description: 'Send fee payment reminders and attendance alerts',
        category: 'communication',
        priority: 2
      },
      {
        name: 'update-statistics',
        schedule: '*/30 * * * *',
        enabled: true,
        description: 'Update cached statistics and analytics data',
        category: 'analytics',
        priority: 3
      },
      {
        name: 'cleanup-old-logs',
        schedule: '0 2 * * *',
        enabled: true,
        description: 'Clean up old audit logs and system records',
        category: 'maintenance',
        priority: 4
      },
      {
        name: 'backup-database',
        schedule: '0 3 * * 0',
        enabled: false,
        description: 'Create automated database backups',
        category: 'backup',
        priority: 5
      }
    ];

    return NextResponse.json({
      success: true,
      configs: defaultConfigs,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[School Cron] GET error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Cron configurations are controlled by super admin only
  return NextResponse.json({
    error: 'Cron configurations are managed by super admin only'
  }, { status: 403 });
}

// Simple cron expression validation
function isValidCronExpression(expression: string): boolean {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) return false;
  
  const validPatterns = [
    /^\*$/,
    /^\d+$/,
    /^\d+-\d+$/,
    /^\*\/\d+$/,
    /^\d+(,\d+)*$/
  ];
  
  return parts.every(part => {
    if (part === '*') return true;
    return validPatterns.some(pattern => pattern.test(part));
  });
}
