/**
 * Cron Job Configuration
 * Central place to manage job settings, schedules, and enable/disable status
 */

export interface CronJobConfig {
  name: string;
  schedule: string; // cron expression
  enabled: boolean;
  description: string;
  category: 'communication' | 'maintenance' | 'analytics' | 'backup';
  priority: number; // Lower number = higher priority
  timeout?: number; // Timeout in seconds
  retryAttempts?: number;
}

/**
 * Default cron job configurations
 * You can modify these settings to enable/disable jobs or change frequencies
 */
export const cronJobConfigs: CronJobConfig[] = [
  {
    name: 'process-communication-outbox',
    schedule: '*/5 * * * *', // Every 5 minutes
    enabled: true,
    description: 'Process pending communication outbox emails and notifications',
    category: 'communication',
    priority: 1, // Highest priority
    timeout: 300, // 5 minutes timeout
    retryAttempts: 3,
  },
  {
    name: 'send-reminders',
    schedule: '0 9 * * *', // Daily at 9:00 AM
    enabled: true,
    description: 'Send fee payment reminders and attendance alerts',
    category: 'communication',
    priority: 2,
    timeout: 600, // 10 minutes timeout
    retryAttempts: 2,
  },
  {
    name: 'update-statistics',
    schedule: '*/30 * * * *', // Every 30 minutes
    enabled: true,
    description: 'Update cached statistics and analytics data',
    category: 'analytics',
    priority: 3,
    timeout: 180, // 3 minutes timeout
    retryAttempts: 2,
  },
  {
    name: 'cleanup-old-logs',
    schedule: '0 2 * * *', // Daily at 2:00 AM
    enabled: true,
    description: 'Clean up old audit logs and system records',
    category: 'maintenance',
    priority: 4,
    timeout: 900, // 15 minutes timeout
    retryAttempts: 1,
  },
  {
    name: 'backup-database',
    schedule: '0 3 * * 0', // Weekly on Sunday at 3:00 AM
    enabled: false, // Disabled by default
    description: 'Create automated database backups',
    category: 'backup',
    priority: 5, // Lowest priority
    timeout: 1800, // 30 minutes timeout
    retryAttempts: 1,
  },
];

/**
 * Get job configuration by name
 */
export function getCronJobConfig(name: string): CronJobConfig | undefined {
  return cronJobConfigs.find(config => config.name === name);
}

/**
 * Update job configuration
 * Note: This updates in-memory only. For persistence, you might want to store in database
 */
export function updateCronJobConfig(name: string, updates: Partial<CronJobConfig>): boolean {
  const config = getCronJobConfig(name);
  if (config) {
    Object.assign(config, updates);
    return true;
  }
  return false;
}

/**
 * Enable/disable a job
 */
export function setCronJobEnabled(name: string, enabled: boolean): boolean {
  return updateCronJobConfig(name, { enabled });
}

/**
 * Change job schedule
 */
export function setCronJobSchedule(name: string, schedule: string): boolean {
  // Basic validation of cron expression
  if (!isValidCronExpression(schedule)) {
    throw new Error(`Invalid cron expression: ${schedule}`);
  }
  return updateCronJobConfig(name, { schedule });
}

/**
 * Get jobs by category
 */
export function getCronJobsByCategory(category: CronJobConfig['category']): CronJobConfig[] {
  return cronJobConfigs.filter(config => config.category === category);
}

/**
 * Get enabled jobs only
 */
export function getEnabledCronJobs(): CronJobConfig[] {
  return cronJobConfigs.filter(config => config.enabled);
}

/**
 * Validate basic cron expression format
 * This is a simple validation - you might want to use a more sophisticated validator
 */
function isValidCronExpression(expression: string): boolean {
  // Basic pattern: 5 parts separated by spaces
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) {
    return false;
  }
  
  // Very basic validation - you can enhance this
  const validPatterns = [
    /^\*$/, // Any value
    /^\d+$/, // Exact number
    /^\d+-\d+$/, // Range
    /^\*\/\d+$/, // Step values
    /^\d+(,\d+)*$/, // Multiple values
  ];
  
  return parts.every(part => {
    if (part === '*') return true;
    return validPatterns.some(pattern => pattern.test(part));
  });
}

/**
 * Common cron schedule presets for easy selection
 */
export const cronSchedulePresets = {
  // Communication schedules
  'every-minute': '* * * * *',
  'every-5-minutes': '*/5 * * * *',
  'every-10-minutes': '*/10 * * * *',
  'every-15-minutes': '*/15 * * * *',
  'every-30-minutes': '*/30 * * * *',
  'every-hour': '0 * * * *',
  
  // Daily schedules
  'midnight': '0 0 * * *',
  '2-am': '0 2 * * *',
  '3-am': '0 3 * * *',
  '6-am': '0 6 * * *',
  '9-am': '0 9 * * *',
  'noon': '0 12 * * *',
  '6-pm': '0 18 * * *',
  '9-pm': '0 21 * * *',
  
  // Weekly schedules
  'sunday-midnight': '0 0 * * 0',
  'sunday-3-am': '0 3 * * 0',
  'monday-midnight': '0 0 * * 1',
  'friday-6-pm': '0 18 * * 5',
  
  // Monthly schedules
  'first-day-midnight': '0 0 1 * *',
  'first-day-2-am': '0 2 1 * *',
  'last-day-midnight': '0 0 L * *',
};

/**
 * Get human readable description of cron schedule
 */
export function getCronScheduleDescription(schedule: string): string {
  const parts = schedule.split(' ');
  
  if (parts[0].startsWith('*/')) {
    const minutes = parseInt(parts[0].substring(2));
    if (minutes === 1) return 'Every minute';
    return `Every ${minutes} minutes`;
  }
  
  if (parts[0] === '0' && parts[1] === '0' && parts[2] === '*' && parts[3] === '*' && parts[4] === '*') {
    return 'Every day at midnight';
  }
  
  if (parts[0] === '0' && parts[1] !== '*' && parts[2] === '*' && parts[3] === '*' && parts[4] === '*') {
    const hour = parseInt(parts[1]);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    return `Every day at ${displayHour}:00 ${ampm}`;
  }
  
  if (parts[2] !== '*' && parts[3] === '*' && parts[4] === '*') {
    const day = parseInt(parts[2]);
    const hour = parseInt(parts[1]) || 0;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    return `Every month on day ${day} at ${displayHour}:00 ${ampm}`;
  }
  
  if (parts[4] !== '*') {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayIndex = parseInt(parts[4]);
    const dayName = days[dayIndex] || 'Unknown';
    const hour = parseInt(parts[1]) || 0;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    return `Every ${dayName} at ${displayHour}:00 ${ampm}`;
  }
  
  return schedule; // Return original if no pattern matches
}
