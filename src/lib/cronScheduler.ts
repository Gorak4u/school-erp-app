import cron, { type ScheduledTask } from 'node-cron';
import { saasPrisma } from './prisma';

/**
 * Production-Ready Cron Scheduler
 *
 * Design principles:
 * - ALL config stored in DB (CronJobConfig table) - never resets on restart
 * - Jobs dispatch by calling their own API route with CRON_SECRET header
 * - Each job run is logged in CronJobRun table with duration + output
 * - Separate scope: 'school' jobs vs 'saas' jobs
 * - Auto-seeds default config on first startup if DB is empty
 */

const TZ = 'Asia/Kolkata';
const CRON_SECRET = process.env.CRON_SECRET || '';
const cronGlobals = globalThis as typeof globalThis & {
  __cronSchedulerInitialized?: boolean;
  __cronSchedulerInitPromise?: Promise<boolean> | null;
};

// Active node-cron task handles
const activeTasks = new Map<string, ScheduledTask>();

// Derive the server's actual listening URL for internal dispatch
function getInternalBaseUrl() {
  const port = process.env.PORT || 3000;
  const host = process.env.NODE_ENV === 'production'
    ? process.env.NEXTAUTH_URL?.replace(/^https?:\/\//, '').split('/')[0] || 'localhost'
    : 'localhost';
  return `http://${host}:${port}`;
}

// ─── Default Job Definitions ────────────────────────────────────────────────

const DEFAULT_JOBS = [
  // ── School jobs ──
  {
    jobName: 'process-communication-outbox',
    scope: 'school',
    category: 'communication',
    description: 'Process queued emails and send them via school SMTP',
    schedule: '*/5 * * * *',
    enabled: true,
  },
  {
    jobName: 'send-reminders',
    scope: 'school',
    category: 'communication',
    description: 'Send fee payment reminders and low-attendance alerts',
    schedule: '0 9 * * *',
    enabled: true,
  },
  {
    jobName: 'update-statistics',
    scope: 'school',
    category: 'analytics',
    description: 'Refresh cached school statistics (students, fees, attendance)',
    schedule: '0 */2 * * *',
    enabled: true,
  },
  {
    jobName: 'cleanup-logs',
    scope: 'school',
    category: 'maintenance',
    description: 'Delete audit logs and sent outbox entries older than 90 days',
    schedule: '0 2 * * 0',
    enabled: true,
  },
  {
    jobName: 'cleanup-notifications',
    scope: 'school',
    category: 'maintenance',
    description: 'Delete notifications older than 90 days',
    schedule: '0 3 * * 0',
    enabled: true,
  },
  // ── SaaS jobs ──
  {
    jobName: 'process-renewals',
    scope: 'saas',
    category: 'billing',
    description: 'Process subscription renewals and send invoice emails via SaaS SMTP',
    schedule: '0 */6 * * *',
    enabled: true,
  },
  {
    jobName: 'process-suspensions',
    scope: 'saas',
    category: 'billing',
    description: 'Suspend overdue subscriptions and notify school admins',
    schedule: '0 4 * * *',
    enabled: true,
  },
  {
    jobName: 'promo-cleanup',
    scope: 'saas',
    category: 'marketing',
    description: 'Deactivate expired promo codes and log usage stats',
    schedule: '0 2 * * 0',
    enabled: true,
  },
];

const DEFAULT_JOB_MAP = new Map(DEFAULT_JOBS.map((job) => [job.jobName, job]));

// ─── DB helpers ─────────────────────────────────────────────────────────────

const db = () => (saasPrisma as any);

function isDatabaseConnectivityError(error: any) {
  const message = String(error?.message || '').toLowerCase();
  return (
    error?.code === 'P1001' ||
    error?.name === 'DriverAdapterError' ||
    message.includes('database') ||
    message.includes('connection') ||
    message.includes('db not reachable') ||
    message.includes('database unreachable')
  );
}

async function seedDefaultConfigs() {
  for (const job of DEFAULT_JOBS) {
    await db().cronJobConfig.upsert({
      where: { jobName: job.jobName },
      update: {
        scope: job.scope,
        category: job.category,
        description: job.description,
      },
      create: job,
    });
  }
}

async function loadEnabledConfigs() {
  return db().cronJobConfig.findMany({
    where: { enabled: true },
    orderBy: { scope: 'asc' },
  });
}

async function markRunStart(jobName: string, scope: string, triggeredBy: string) {
  return db().cronJobRun.create({
    data: { jobName, scope, status: 'running', triggeredBy },
  });
}

async function markRunFinish(
  runId: string,
  jobName: string,
  status: 'success' | 'failed',
  durationMs: number,
  processed: number,
  failed: number,
  output: string,
  error?: string,
) {
  const now = new Date();
  await Promise.all([
    db().cronJobRun.update({
      where: { id: runId },
      data: { status, finishedAt: now, durationMs, processed, failed, output, error },
    }),
    db().cronJobConfig.update({
      where: { jobName },
      data: { lastRunAt: now, lastStatus: status, lastRunMs: durationMs },
    }),
  ]);
}

// ─── Job dispatcher ──────────────────────────────────────────────────────────

async function dispatchJob(jobName: string, scope: string, triggeredBy = 'scheduler') {
  const run = await markRunStart(jobName, scope, triggeredBy);
  const start = Date.now();
  let status: 'success' | 'failed' = 'success';
  let output = '';
  let error = '';
  let processed = 0;
  let failed = 0;
  let message = '';

  try {
    const url = `${getInternalBaseUrl()}/api/cron/${jobName}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${CRON_SECRET}`,
      },
      signal: AbortSignal.timeout(15 * 60 * 1000), // 15 min hard timeout
    });

    const body = await res.json().catch(() => ({}));
    output = JSON.stringify(body).slice(0, 4000);
    processed = body.processed ?? body.result?.processed ?? body.results?.processed ?? 0;
    failed = body.failed ?? body.result?.failed ?? body.results?.failed ?? 0;
    message = body.message || body.error || '';

    if (!res.ok || body?.success === false) {
      status = 'failed';
      error = body.error || body.message || `HTTP ${res.status}`;
    }
  } catch (err: any) {
    status = 'failed';
    error = err.message ?? String(err);
  }

  const durationMs = Date.now() - start;
  await markRunFinish(run.id, jobName, status, durationMs, processed, failed, output, error || undefined);

  console.log(
    `[Cron][${scope}] ${jobName} → ${status} in ${durationMs}ms` +
      (processed ? ` (${processed} records)` : ''),
  );

  return {
    success: status === 'success',
    message: error || message || `Job "${jobName}" ${status}`,
    processed,
    failed,
    runId: run.id,
  };
}

// ─── Scheduler lifecycle ─────────────────────────────────────────────────────

export async function initializeCronScheduler(): Promise<boolean> {
  console.log('[Cron] Initializing scheduler…');

  try {
    await seedDefaultConfigs();
    const jobs = await loadEnabledConfigs();

    // Stop any previously running tasks (hot-reload safe)
    stopAllJobs();

    for (const job of jobs) {
      if (!cron.validate(job.schedule)) {
        console.warn(`[Cron] Invalid schedule for ${job.jobName}: "${job.schedule}" – skipped`);
        continue;
      }

      const task = cron.schedule(
        job.schedule,
        () => dispatchJob(job.jobName, job.scope, 'scheduler'),
        { timezone: TZ },
      );

      activeTasks.set(job.jobName, task);
      console.log(`[Cron] Scheduled ${job.scope}/${job.jobName} @ "${job.schedule}"`);
    }

    console.log(`[Cron] ${activeTasks.size} jobs active`);
    return true;
  } catch (err) {
    if (isDatabaseConnectivityError(err)) {
      console.warn('[Cron] Database unavailable, skipping cron scheduler initialization for now.');
      return false;
    }

    console.error('[Cron] Failed to initialize:', err);
    return false;
  }
}

export function stopAllJobs() {
  activeTasks.forEach((task) => task.stop());
  activeTasks.clear();
}

// ─── Management functions (called by API) ────────────────────────────────────

export async function triggerJobNow(jobName: string): Promise<{ success: boolean; message: string }> {
  const config = await db().cronJobConfig.findUnique({ where: { jobName } });
  if (!config) return { success: false, message: `Job "${jobName}" not found` };

  const result = await dispatchJob(jobName, config.scope, 'manual');
  return { success: result.success, message: result.message };
}

export async function setJobEnabled(jobName: string, enabled: boolean): Promise<boolean> {
  const updated = await db().cronJobConfig.update({
    where: { jobName },
    data: { enabled },
  }).catch(() => null);

  if (!updated) return false;

  if (!enabled) {
    activeTasks.get(jobName)?.stop();
    activeTasks.delete(jobName);
  } else {
    // Re-schedule with current stored schedule
    const task = cron.schedule(
      updated.schedule,
      () => dispatchJob(jobName, updated.scope, 'scheduler'),
      { timezone: TZ },
    );
    activeTasks.set(jobName, task);
  }
  return true;
}

export async function setJobSchedule(jobName: string, schedule: string): Promise<boolean> {
  if (!cron.validate(schedule)) return false;

  const updated = await db().cronJobConfig.update({
    where: { jobName },
    data: { schedule },
  }).catch(() => null);

  if (!updated) return false;

  // Restart with new schedule if currently active
  if (activeTasks.has(jobName)) {
    activeTasks.get(jobName)!.stop();
    const task = cron.schedule(
      schedule,
      () => dispatchJob(jobName, updated.scope, 'scheduler'),
      { timezone: TZ },
    );
    activeTasks.set(jobName, task);
  }
  return true;
}

export async function getCronStatus() {
  const configs = await db().cronJobConfig.findMany({
    orderBy: [{ scope: 'asc' }, { category: 'asc' }, { jobName: 'asc' }],
  });

  const [recentRuns, runningRuns] = await Promise.all([
    db().cronJobRun.findMany({
      orderBy: { startedAt: 'desc' },
      take: 50,
    }),
    db().cronJobRun.findMany({
      where: { status: 'running', finishedAt: null },
      select: { jobName: true },
    }),
  ]);

  const runningJobNames = new Set(runningRuns.map((run: { jobName: string }) => run.jobName));

  return {
    jobs: configs.map((c: any) => {
      const meta = DEFAULT_JOB_MAP.get(c.jobName);
      return {
        ...c,
        scope: meta?.scope || c.scope,
        category: meta?.category || c.category,
        description: meta?.description || c.description,
        running: runningJobNames.has(c.jobName),
      };
    }),
    recentRuns,
    activeCount: activeTasks.size,
  };
}

// ─── Auto-init in production ──────────────────────────────────────────────────

let initialized = false;
export function ensureInitialized() {
  if (initialized || cronGlobals.__cronSchedulerInitialized) {
    return;
  }

  initialized = true;
  cronGlobals.__cronSchedulerInitialized = true;
  cronGlobals.__cronSchedulerInitPromise = initializeCronScheduler()
    .then((ready) => {
      if (!ready) {
        initialized = false;
        cronGlobals.__cronSchedulerInitialized = false;
      }
      return ready;
    })
    .catch((error) => {
      initialized = false;
      cronGlobals.__cronSchedulerInitialized = false;
      console.error('[Cron] Failed to auto-initialize scheduler in server process:', error);
      return false;
    });
}
