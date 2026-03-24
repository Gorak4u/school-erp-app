import cron from 'node-cron';
import { NextRequest } from 'next/server';
import { 
  cronJobConfigs, 
  getCronJobConfig, 
  getEnabledCronJobs,
  setCronJobEnabled,
  setCronJobSchedule,
  getCronScheduleDescription
} from './cronConfig';

/**
 * In-Application Cron Job Scheduler
 * All scheduled jobs are defined and managed within the application
 */

// Job configuration interface
interface CronJob {
  name: string;
  schedule: string; // cron expression
  handler: () => Promise<void>;
  enabled: boolean;
  description?: string;
}

// Store active cron tasks
const activeTasks = new Map<string, any>(); // Using any since node-cron types are complex

/**
 * Get job handler for a specific job name
 */
function getJobHandler(jobName: string): (() => Promise<void>) | null {
  switch (jobName) {
    case 'process-communication-outbox':
      return async () => {
        try {
          // Import and call the function directly
          const { processCommunicationOutboxBatch } = await import('@/lib/communicationOutboxProcessor');
          const result = await processCommunicationOutboxBatch({
            limit: 50,
          });
          console.log(`✅ [${new Date().toISOString()}] Outbox processed:`, result);
        } catch (error) {
          console.error(`❌ [${new Date().toISOString()}] Outbox processing failed:`, error);
        }
      };

    case 'cleanup-old-logs':
      return async () => {
        try {
          // Import Prisma directly
          const { schoolPrisma } = await import('@/lib/prisma');
          
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - 7);

          // Clean up old audit logs
          const auditLogsDeleted = await schoolPrisma.auditLog.deleteMany({
            where: {
              createdAt: {
                lt: cutoffDate,
              },
            },
          });

          // Clean up old communication outbox entries
          const outboxDeleted = await schoolPrisma.communicationOutbox.deleteMany({
            where: {
              createdAt: {
                lt: cutoffDate,
              },
            },
          });

          console.log(`✅ [${new Date().toISOString()}] Logs cleaned up:`, {
            auditLogs: auditLogsDeleted.count,
            outboxEntries: outboxDeleted.count,
            cutoffDate: cutoffDate.toISOString(),
          });
        } catch (error) {
          console.error(`❌ [${new Date().toISOString()}] Log cleanup failed:`, error);
        }
      };

    case 'backup-database':
      return async () => {
        try {
          console.log(`✅ [${new Date().toISOString()}] Database backup: Not implemented yet`);
          // TODO: Implement database backup logic
        } catch (error) {
          console.error(`❌ [${new Date().toISOString()}] Database backup failed:`, error);
        }
      };

    case 'send-reminders':
      return async () => {
        try {
          // Import Prisma directly
          const { schoolPrisma } = await import('@/lib/prisma');
          const { queueCommunicationOutbox } = await import('@/lib/communicationOutbox');
          
          const reminders = {
            feeReminders: 0,
            attendanceReminders: 0,
            deadlineReminders: 0,
          };

          // Send fee payment reminders - Group by student to send consolidated emails
          const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          const pendingFees = await schoolPrisma.feeRecord.findMany({
            where: {
              status: 'pending',
              dueDate: {
                lt: sevenDaysFromNow.toISOString(),
              },
            },
            include: {
              feeStructure: {
                select: {
                  name: true,
                }
              }
            }
          });

          // Group pending fees by student
          const feesByStudent = new Map<string, typeof pendingFees>();
          pendingFees.forEach(fee => {
            if (!feesByStudent.has(fee.studentId)) {
              feesByStudent.set(fee.studentId, []);
            }
            feesByStudent.get(fee.studentId)!.push(fee);
          });

          // Send one consolidated email per student
          for (const [studentId, studentFees] of feesByStudent.entries()) {
            const student = await schoolPrisma.student.findUnique({
              where: { id: studentId },
              select: {
                id: true,
                name: true,
                email: true,
                fatherEmail: true,
                motherEmail: true,
                phone: true,
                fatherPhone: true,
                schoolId: true,
              },
            });

            if (!student) continue;

            // Calculate totals
            const totalAmount = studentFees.reduce((sum, fee) => sum + Number(fee.amount), 0);
            const earliestDueDate = studentFees.reduce((earliest, fee) => 
              new Date(fee.dueDate) < new Date(earliest.dueDate) ? fee : earliest
            ).dueDate;

            const recipientEmails = [
              student.email,
              student.fatherEmail,
              student.motherEmail,
            ].filter(Boolean);

            // Generate fee details HTML
            const feeDetailsHtml = studentFees.map(fee => `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px; text-align: left; color: #1e293b; font-size: 14px;">
                  ${fee.feeStructure?.name || 'Fee'}
                </td>
                <td style="padding: 12px; text-align: center; color: #64748b; font-size: 14px;">
                  ${fee.dueDate}
                </td>
                <td style="padding: 12px; text-align: right; color: #dc2626; font-weight: 600; font-size: 14px;">
                  ₹${fee.amount}
                </td>
              </tr>
            `).join('');

            for (const email of recipientEmails) {
              if (!email) continue;
              await queueCommunicationOutbox({
                email: {
                  to: email,
                  subject: `Fee Payment Reminder - ${student.name} (${studentFees.length} Pending Fees)`,
                  html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: linear-gradient(135deg, #f8fafc, #e2e8f0); padding: 24px; border-radius: 8px; margin-bottom: 20px;">
                    <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                      <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 24px; font-weight: 600;">💳 Fee Payment Reminder</h2>
                      <p style="color: #475569; margin: 0 0 16px 0; font-size: 16px;">Dear Parent/Guardian,</p>
                      <p style="color: #64748b; margin: 0 0 20px 0; font-size: 15px; line-height: 1.6;">
                        This is a friendly reminder that <strong style="color: #1e293b;">${student.name}</strong> has <strong style="color: #dc2626;">${studentFees.length} pending fee(s)</strong> due soon.
                      </p>
                      
                      <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
                        <h3 style="color: #1e293b; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">Fee Details</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                          <thead>
                            <tr style="background: #f1f5f9;">
                              <th style="padding: 12px; text-align: left; color: #475569; font-size: 13px; font-weight: 600;">Fee Type</th>
                              <th style="padding: 12px; text-align: center; color: #475569; font-size: 13px; font-weight: 600;">Due Date</th>
                              <th style="padding: 12px; text-align: right; color: #475569; font-size: 13px; font-weight: 600;">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${feeDetailsHtml}
                          </tbody>
                          <tfoot>
                            <tr style="background: #1e293b; color: white;">
                              <td colspan="2" style="padding: 16px; text-align: right; font-size: 15px; font-weight: 600;">
                                Total Amount Due:
                              </td>
                              <td style="padding: 16px; text-align: right; font-size: 18px; font-weight: 700;">
                                ₹${totalAmount}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                      
                      <div style="background: #fef3c7; padding: 16px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                        <p style="color: #92400e; margin: 0 0 8px 0; font-size: 14px; font-weight: 500;">
                          ⚠️ <strong>Important:</strong> Earliest due date is <strong>${earliestDueDate}</strong>
                        </p>
                        <p style="color: #92400e; margin: 0; font-size: 13px;">
                          Please ensure timely payment to avoid any late fees. You can pay individual fees or the total amount.
                        </p>
                      </div>
                      
                      <div style="margin: 24px 0;">
                        <p style="color: #64748b; margin: 0 0 12px 0; font-size: 14px;">
                          For payment assistance or queries, please contact the school office.
                        </p>
                      </div>
                      
                      <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                        <p style="color: #475569; margin: 0; font-size: 14px;">
                          Best regards,<br>
                          <strong style="color: #1e293b;">School Administration</strong><br>
                          <span style="color: #64748b; font-size: 12px;">Finance Department</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              `,
                  schoolId: student.schoolId || undefined,
                },
              });
              reminders.feeReminders++;
            }
          }

          console.log(`✅ [${new Date().toISOString()}] Reminders sent:`, reminders);
        } catch (error) {
          console.error(`❌ [${new Date().toISOString()}] Reminder sending failed:`, error);
        }
      };

    case 'update-statistics':
      return async () => {
        try {
          // Import Prisma directly
          const { schoolPrisma } = await import('@/lib/prisma');
          
          const stats = {
            students: { total: 0, active: 0, newThisMonth: 0 },
            teachers: { total: 0, active: 0 },
            fees: { total: 0, collected: 0, pending: 0, collectionRate: 0 },
            attendance: { overall: 0, thisWeek: 0 },
          };

          // Student Statistics
          const now = new Date();
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

          const [totalStudents, activeStudents, newStudents] = await Promise.all([
            schoolPrisma.student.count(),
            schoolPrisma.student.count({ where: { status: 'active' } }),
            schoolPrisma.student.count({
              where: {
                createdAt: {
                  gte: monthStart,
                },
              },
            }),
          ]);

          stats.students = {
            total: totalStudents,
            active: activeStudents,
            newThisMonth: newStudents,
          };

          console.log(`✅ [${new Date().toISOString()}] Statistics updated:`, stats);
        } catch (error) {
          console.error(`❌ [${new Date().toISOString()}] Statistics update failed:`, error);
        }
      };

    default:
      return null;
  }
}

/**
 * Initialize and start all enabled cron jobs
 */
export function initializeCronJobs() {
  console.log('🚀 [Cron] Initializing cron jobs...');
  
  const enabledJobs = getEnabledCronJobs();
  
  enabledJobs.forEach((config) => {
    const handler = getJobHandler(config.name);
    if (!handler) {
      console.error(`❌ [Cron] No handler found for job: ${config.name}`);
      return;
    }

    try {
      const task = cron.schedule(config.schedule, handler, {
        timezone: 'Asia/Kolkata', // Set your timezone
      });
      
      activeTasks.set(config.name, task);
      const scheduleDesc = getCronScheduleDescription(config.schedule);
      console.log(`✅ [Cron] Started job: ${config.name} (${scheduleDesc}) - ${config.description}`);
    } catch (error) {
      console.error(`❌ [Cron] Failed to start job: ${config.name}`, error);
    }
  });

  console.log(`📊 [Cron] ${activeTasks.size} jobs started successfully`);
}

/**
 * Stop a specific cron job
 */
export function stopCronJob(jobName: string): boolean {
  const task = activeTasks.get(jobName);
  if (task) {
    task.stop();
    activeTasks.delete(jobName);
    console.log(`⏹️  [Cron] Stopped job: ${jobName}`);
    return true;
  }
  return false;
}

/**
 * Start a specific cron job
 */
export function startCronJob(jobName: string): boolean {
  const config = getCronJobConfig(jobName);
  if (!config || !config.enabled) {
    console.log(`⚠️  [Cron] Job not found or disabled: ${jobName}`);
    return false;
  }

  const handler = getJobHandler(jobName);
  if (!handler) {
    console.error(`❌ [Cron] No handler found for job: ${jobName}`);
    return false;
  }

  try {
    const task = cron.schedule(config.schedule, handler, {
      timezone: 'Asia/Kolkata',
    });
    
    activeTasks.set(jobName, task);
    const scheduleDesc = getCronScheduleDescription(config.schedule);
    console.log(`▶️  [Cron] Started job: ${jobName} (${scheduleDesc})`);
    return true;
  } catch (error) {
    console.error(`❌ [Cron] Failed to start job: ${jobName}`, error);
    return false;
  }
}

/**
 * Get status of all cron jobs
 */
export function getCronJobStatus() {
  return {
    total: cronJobConfigs.length,
    running: activeTasks.size,
    jobs: cronJobConfigs.map(job => ({
      name: job.name,
      schedule: job.schedule,
      scheduleDescription: getCronScheduleDescription(job.schedule),
      enabled: job.enabled,
      running: activeTasks.has(job.name),
      description: job.description,
      category: job.category,
      priority: job.priority,
    })),
  };
}

/**
 * Stop all cron jobs
 */
export function stopAllCronJobs() {
  console.log('🛑 [Cron] Stopping all cron jobs...');
  activeTasks.forEach((task, name) => {
    task.stop();
    console.log(`⏹️  [Cron] Stopped job: ${name}`);
  });
  activeTasks.clear();
  console.log('✅ [Cron] All jobs stopped');
}

/**
 * Manually trigger a cron job
 */
export async function triggerCronJob(jobName: string) {
  const handler = getJobHandler(jobName);
  if (handler) {
    console.log(`🔥 [Cron] Manually triggering job: ${jobName}`);
    try {
      await handler();
      console.log(`✅ [Cron] Manual trigger completed: ${jobName}`);
      return { success: true, message: `Job ${jobName} executed successfully` };
    } catch (error: any) {
      console.error(`❌ [Cron] Manual trigger failed: ${jobName}`, error);
      return { success: false, message: `Job ${jobName} failed: ${error.message}` };
    }
  }
  return { success: false, message: `Job ${jobName} not found` };
}

/**
 * Enable/disable a cron job
 */
export function enableCronJob(jobName: string, enabled: boolean): boolean {
  // Stop the job if it's running and we're disabling it
  if (!enabled && activeTasks.has(jobName)) {
    stopCronJob(jobName);
  }
  
  // Update configuration
  const success = setCronJobEnabled(jobName, enabled);
  
  // Start the job if we're enabling it
  if (enabled && success && !activeTasks.has(jobName)) {
    startCronJob(jobName);
  }
  
  return success;
}

/**
 * Update cron job schedule
 */
export function updateCronJobSchedule(jobName: string, schedule: string): boolean {
  // Stop the job if it's running
  const wasRunning = activeTasks.has(jobName);
  if (wasRunning) {
    stopCronJob(jobName);
  }
  
  // Update configuration
  const success = setCronJobSchedule(jobName, schedule);
  
  // Restart the job with new schedule if it was running
  if (success && wasRunning) {
    startCronJob(jobName);
  }
  
  return success;
}

// Export all configurations for reference
export { cronJobConfigs };

// Auto-initialize when module is imported (in production)
if (process.env.NODE_ENV === 'production') {
  initializeCronJobs();
}
