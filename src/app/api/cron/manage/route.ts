import { NextRequest, NextResponse } from 'next/server';
import { 
  initializeCronJobs, 
  stopAllCronJobs, 
  getCronJobStatus, 
  stopCronJob, 
  startCronJob, 
  triggerCronJob,
  enableCronJob,
  updateCronJobSchedule,
  cronJobConfigs
} from '@/lib/cronJobs';
import { 
  cronSchedulePresets,
  getCronScheduleDescription
} from '@/lib/cronConfig';

/**
 * Cron Job Management API
 * GET - Get status of all cron jobs
 * POST - Control cron jobs (start/stop/trigger/enable/disable/update schedule)
 */
export async function GET(request: NextRequest) {
  try {
    const status = getCronJobStatus();
    return NextResponse.json({
      success: true,
      status,
      presets: cronSchedulePresets,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Cron Management] GET error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, jobName, schedule, enabled } = body;

    switch (action) {
      case 'initialize':
        initializeCronJobs();
        return NextResponse.json({
          success: true,
          message: 'Cron jobs initialized',
          timestamp: new Date().toISOString(),
        });

      case 'stopAll':
        stopAllCronJobs();
        return NextResponse.json({
          success: true,
          message: 'All cron jobs stopped',
          timestamp: new Date().toISOString(),
        });

      case 'stop':
        if (!jobName) {
          return NextResponse.json({
            success: false,
            error: 'jobName is required for stop action',
          }, { status: 400 });
        }
        const stopped = stopCronJob(jobName);
        return NextResponse.json({
          success: stopped,
          message: stopped ? `Job ${jobName} stopped` : `Job ${jobName} not found or not running`,
          timestamp: new Date().toISOString(),
        });

      case 'start':
        if (!jobName) {
          return NextResponse.json({
            success: false,
            error: 'jobName is required for start action',
          }, { status: 400 });
        }
        const started = startCronJob(jobName);
        return NextResponse.json({
          success: started,
          message: started ? `Job ${jobName} started` : `Job ${jobName} not found or disabled`,
          timestamp: new Date().toISOString(),
        });

      case 'trigger':
        if (!jobName) {
          return NextResponse.json({
            success: false,
            error: 'jobName is required for trigger action',
          }, { status: 400 });
        }
        const result = await triggerCronJob(jobName);
        return NextResponse.json({
          ...result,
          timestamp: new Date().toISOString(),
        });

      case 'enable':
        if (!jobName) {
          return NextResponse.json({
            success: false,
            error: 'jobName is required for enable action',
          }, { status: 400 });
        }
        if (typeof enabled !== 'boolean') {
          return NextResponse.json({
            success: false,
            error: 'enabled field must be true or false',
          }, { status: 400 });
        }
        const enableResult = enableCronJob(jobName, enabled);
        return NextResponse.json({
          success: enableResult,
          message: enableResult 
            ? `Job ${jobName} ${enabled ? 'enabled' : 'disabled'} successfully`
            : `Failed to ${enabled ? 'enable' : 'disable'} job ${jobName}`,
          timestamp: new Date().toISOString(),
        });

      case 'updateSchedule':
        if (!jobName) {
          return NextResponse.json({
            success: false,
            error: 'jobName is required for updateSchedule action',
          }, { status: 400 });
        }
        if (!schedule) {
          return NextResponse.json({
            success: false,
            error: 'schedule is required for updateSchedule action',
          }, { status: 400 });
        }
        try {
          const scheduleResult = updateCronJobSchedule(jobName, schedule);
          return NextResponse.json({
            success: scheduleResult,
            message: scheduleResult 
              ? `Job ${jobName} schedule updated to ${schedule} (${getCronScheduleDescription(schedule)})`
              : `Failed to update schedule for job ${jobName}`,
            timestamp: new Date().toISOString(),
          });
        } catch (error: any) {
          return NextResponse.json({
            success: false,
            error: error.message,
          }, { status: 400 });
        }

      case 'getConfig':
        if (!jobName) {
          return NextResponse.json({
            success: false,
            error: 'jobName is required for getConfig action',
          }, { status: 400 });
        }
        const config = cronJobConfigs.find(c => c.name === jobName);
        if (!config) {
          return NextResponse.json({
            success: false,
            error: `Job ${jobName} not found`,
          }, { status: 404 });
        }
        return NextResponse.json({
          success: true,
          config: {
            ...config,
            scheduleDescription: getCronScheduleDescription(config.schedule),
          },
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported actions: initialize, stopAll, stop, start, trigger, enable, disable, updateSchedule, getConfig',
        }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[Cron Management] POST error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
