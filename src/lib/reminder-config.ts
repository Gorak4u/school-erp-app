import { prisma } from '@/lib/prisma';

export interface ReminderConfig {
  enabled: boolean;
  daysBefore: number[];
  timeOfDay: string; // HH:MM format
  timezone: string;
  subject: string;
  template: string;
}

export interface ReminderSchedule {
  trialExpiry: ReminderConfig;
  subscriptionRenewal: ReminderConfig;
  paymentFailed: ReminderConfig;
  serviceSuspension: ReminderConfig;
  quotaLimitExceeded: ReminderConfig;
}

export const DEFAULT_REMINDER_CONFIG: ReminderSchedule = {
  trialExpiry: {
    enabled: true,
    daysBefore: [7, 3, 1],
    timeOfDay: '09:00',
    timezone: 'Asia/Kolkata',
    subject: 'Trial Expiring Soon - {{schoolName}}',
    template: 'trial_expiry',
  },
  subscriptionRenewal: {
    enabled: true,
    daysBefore: [7, 3, 1],
    timeOfDay: '09:00',
    timezone: 'Asia/Kolkata',
    subject: 'Subscription Renewal - {{schoolName}}',
    template: 'subscription_renewal',
  },
  paymentFailed: {
    enabled: true,
    daysBefore: [0, 1, 3, 7], // Days after payment failure
    timeOfDay: '10:00',
    timezone: 'Asia/Kolkata',
    subject: 'Payment Failed - Action Required - {{schoolName}}',
    template: 'payment_failed',
  },
  serviceSuspension: {
    enabled: true,
    daysBefore: [3, 7, 14], // Days after expiry
    timeOfDay: '09:00',
    timezone: 'Asia/Kolkata',
    subject: 'Service Suspended - {{schoolName}}',
    template: 'service_suspension',
  },
  quotaLimitExceeded: {
    enabled: true,
    daysBefore: [0], // Daily check when quota exceeded
    timeOfDay: '10:00',
    timezone: 'Asia/Kolkata',
    subject: '⚠️ Quota Limit Exceeded - Action Required - {{schoolName}}',
    template: 'quota_limit_exceeded',
  },
};

export async function getReminderConfig(): Promise<ReminderSchedule> {
  try {
    const p = prisma as any;
    const settings = await p.saasSetting.findMany({
      where: { group: 'reminder_schedule' },
    });

    const config: Record<string, any> = {};
    
    // Parse all settings
    for (const setting of settings) {
      try {
        config[setting.key] = JSON.parse(setting.value);
      } catch {
        config[setting.key] = setting.value;
      }
    }

    // Merge with defaults
    return {
      trialExpiry: { ...DEFAULT_REMINDER_CONFIG.trialExpiry, ...config.trialExpiry },
      subscriptionRenewal: { ...DEFAULT_REMINDER_CONFIG.subscriptionRenewal, ...config.subscriptionRenewal },
      paymentFailed: { ...DEFAULT_REMINDER_CONFIG.paymentFailed, ...config.paymentFailed },
      serviceSuspension: { ...DEFAULT_REMINDER_CONFIG.serviceSuspension, ...config.serviceSuspension },
      quotaLimitExceeded: { ...DEFAULT_REMINDER_CONFIG.quotaLimitExceeded, ...config.quotaLimitExceeded },
    };
  } catch (error) {
    console.error('Failed to fetch reminder config, using defaults:', error);
    return DEFAULT_REMINDER_CONFIG;
  }
}

export async function updateReminderConfig(config: Partial<ReminderSchedule>): Promise<void> {
  try {
    const p = prisma as any;
    
    // Update each configuration section
    for (const [key, value] of Object.entries(config)) {
      if (value && DEFAULT_REMINDER_CONFIG[key as keyof ReminderSchedule]) {
        await p.saasSetting.upsert({
          where: {
            group_key: {
              group: 'reminder_schedule',
              key: key,
            },
          },
          update: {
            value: JSON.stringify(value),
          },
          create: {
            group: 'reminder_schedule',
            key: key,
            value: JSON.stringify(value),
          },
        });
      }
    }
    
    console.log('Reminder configuration updated successfully');
  } catch (error) {
    console.error('Failed to update reminder config:', error);
    throw error;
  }
}

export async function getReminderScheduleForType(type: keyof ReminderSchedule): Promise<ReminderConfig> {
  const config = await getReminderConfig();
  return config[type];
}

// Helper function to check if reminder should be sent today
export function shouldSendReminderToday(
  targetDate: Date,
  daysBefore: number[],
  timezone: string = 'Asia/Kolkata'
): boolean {
  const now = new Date();
  const target = new Date(targetDate);
  
  // Convert to target timezone
  const nowInTz = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
  const targetInTz = new Date(target.toLocaleString("en-US", { timeZone: timezone }));
  
  // Calculate days difference
  const diffTime = targetInTz.getTime() - nowInTz.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return daysBefore.includes(diffDays);
}

// Helper function to get next reminder dates
export function getNextReminderDates(
  targetDate: Date,
  daysBefore: number[]
): Date[] {
  return daysBefore.map(days => {
    const date = new Date(targetDate);
    date.setDate(date.getDate() - days);
    return date;
  });
}
