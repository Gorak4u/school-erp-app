import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
  getCronStatus,
  triggerJobNow,
  setJobEnabled,
  setJobSchedule,
  initializeCronScheduler,
  seedDefaultConfigs,
} from '@/lib/cronScheduler';
import { isCronAuthorizationHeaderValid } from '@/lib/cron/route-helpers';

/**
 * Unified Cron Management API
 * GET  /api/cron          → status of all jobs + recent run history
 * POST /api/cron          → management actions
 *
 * Accepts either:
 *   Authorization: Bearer <CRON_SECRET>   (machine/scheduler calls)
 *   OR a valid super-admin NextAuth session (admin UI calls)
 */

async function auth(request: NextRequest): Promise<boolean> {
  // Machine-to-machine: CRON_SECRET bearer token
  if (isCronAuthorizationHeaderValid(request.headers.get('authorization'))) {
    return true;
  }
  // Admin UI: super-admin NextAuth session
  const session = await getServerSession(authOptions as any);
  return !!(session && (session as any).user?.email && (session as any).user?.isSuperAdmin);
}

export async function GET(request: NextRequest) {
  if (!(await auth(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const status = await getCronStatus();
    return NextResponse.json({ success: true, ...status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await auth(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, jobName, schedule } = body as {
      action: string;
      jobName?: string;
      schedule?: string;
    };

    switch (action) {
      case 'initialize': {
        const cronReady = await initializeCronScheduler();
        if (!cronReady) {
          return NextResponse.json(
            { success: false, message: 'Scheduler skipped because the database is unavailable' },
            { status: 503 },
          );
        }
        const status = await getCronStatus();
        return NextResponse.json({ success: true, message: 'Scheduler initialized', ...status });
      }

      case 'seed-defaults': {
        await seedDefaultConfigs();
        const status = await getCronStatus();
        return NextResponse.json({ success: true, message: 'Default cron jobs seeded', ...status });
      }

      case 'trigger': {
        if (!jobName) return NextResponse.json({ error: 'jobName required' }, { status: 400 });
        const result = await triggerJobNow(jobName);
        return NextResponse.json(result, { status: result.success ? 200 : 404 });
      }

      case 'enable':
      case 'disable': {
        if (!jobName) return NextResponse.json({ error: 'jobName required' }, { status: 400 });
        const ok = await setJobEnabled(jobName, action === 'enable');
        if (!ok) return NextResponse.json({ error: `Job "${jobName}" not found` }, { status: 404 });
        const status = await getCronStatus();
        return NextResponse.json({ success: true, message: `Job "${jobName}" ${action}d`, ...status });
      }

      case 'update-schedule': {
        if (!jobName || !schedule) {
          return NextResponse.json({ error: 'jobName and schedule required' }, { status: 400 });
        }
        const ok = await setJobSchedule(jobName, schedule);
        if (!ok) {
          return NextResponse.json(
            { error: `Job "${jobName}" not found or schedule "${schedule}" is invalid` },
            { status: 400 },
          );
        }
        const status = await getCronStatus();
        return NextResponse.json({ success: true, message: `Schedule updated for "${jobName}"`, ...status });
      }

      default:
        return NextResponse.json({ error: `Unknown action: "${action}"` }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
