// Client-safe reminder configuration
// This file contains only types and client-safe functions
// No database or server-side imports

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
    subject: 'Subscription Renewing Soon - {{schoolName}}',
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
    daysBefore: [0], // Send immediately when quota is exceeded
    timeOfDay: '09:00',
    timezone: 'Asia/Kolkata',
    subject: '⚠️ Quota Limit Exceeded - {{schoolName}}',
    template: 'quota_limit_exceeded',
  },
};

// Client-side functions for API calls
export async function getReminderConfigClient(): Promise<ReminderSchedule> {
  try {
    const response = await fetch('/admin/reminder-config');
    if (!response.ok) {
      throw new Error('Failed to fetch reminder configuration');
    }
    const data = await response.json();
    return data.config || DEFAULT_REMINDER_CONFIG;
  } catch (error) {
    console.error('Failed to fetch reminder config, using defaults:', error);
    return DEFAULT_REMINDER_CONFIG;
  }
}

export async function updateReminderConfigClient(config: Partial<ReminderSchedule>): Promise<void> {
  try {
    const response = await fetch('/admin/reminder-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config }),
    });

    if (!response.ok) {
      throw new Error('Failed to update reminder configuration');
    }
  } catch (error) {
    console.error('Failed to update reminder config:', error);
    throw error;
  }
}
