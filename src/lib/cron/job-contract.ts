export type CronJobScope = 'school' | 'saas';

export type CronJobResult = {
  success: boolean;
  jobName: string;
  scope: CronJobScope;
  message: string;
  processed: number;
  attempted: number;
  delivered: number;
  skipped: number;
  failed: number;
  stats?: Record<string, unknown>;
  errors?: string[];
  timestamp: string;
};

export function createCronJobResult(input: {
  success: boolean;
  jobName: string;
  scope: CronJobScope;
  message: string;
  processed?: number;
  attempted?: number;
  delivered?: number;
  skipped?: number;
  failed?: number;
  stats?: Record<string, unknown>;
  errors?: string[];
}): CronJobResult {
  return {
    success: input.success,
    jobName: input.jobName,
    scope: input.scope,
    message: input.message,
    processed: input.processed ?? 0,
    attempted: input.attempted ?? 0,
    delivered: input.delivered ?? 0,
    skipped: input.skipped ?? 0,
    failed: input.failed ?? 0,
    stats: input.stats,
    errors: input.errors ?? [],
    timestamp: new Date().toISOString(),
  };
}
