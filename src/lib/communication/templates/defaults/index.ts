/**
 * Default Templates - Modular exports
 * 
 * Centralized export of all default templates organized by category:
 * - Assignments: assignment-related notifications
 * - Attendance: attendance alerts and summaries
 * - Discounts: discount request and approval notifications
 * - Fees: fee reminders, receipts, and fine waivers
 * - Students: student admissions, leave, and security
 * 
 * @module DefaultTemplates
 */

export * from '../types';
export * from './assignments';
export * from './attendance';
export * from './discounts';
export * from './fees';
export * from './students';

import { DefaultTemplate } from '../types';
import * as assignments from './assignments';
import * as attendance from './attendance';
import * as discounts from './discounts';
import * as fees from './fees';
import * as students from './students';

/**
 * All default templates registry
 */
export const defaultTemplates: Record<string, DefaultTemplate> = {
  // Assignment templates
  [assignments.assignmentPublishedEmail.key]: assignments.assignmentPublishedEmail,
  [assignments.assignmentDueSoonEmail.key]: assignments.assignmentDueSoonEmail,
  [assignments.assignmentOverdueEmail.key]: assignments.assignmentOverdueEmail,
  [assignments.assignmentGradedEmail.key]: assignments.assignmentGradedEmail,
  [assignments.assignmentSubmittedEmail.key]: assignments.assignmentSubmittedEmail,
  
  // Attendance templates
  [attendance.attendanceAbsentEmail.key]: attendance.attendanceAbsentEmail,
  [attendance.attendanceLateEmail.key]: attendance.attendanceLateEmail,
  [attendance.attendanceDailySummaryEmail.key]: attendance.attendanceDailySummaryEmail,
  [attendance.attendanceLowWarningEmail.key]: attendance.attendanceLowWarningEmail,
  
  // Discount templates
  [discounts.discountRequestEmail.key]: discounts.discountRequestEmail,
  [discounts.discountApprovedEmail.key]: discounts.discountApprovedEmail,
  [discounts.discountRejectedEmail.key]: discounts.discountRejectedEmail,
  
  // Fee templates
  [fees.feeReminderEmail.key]: fees.feeReminderEmail,
  [fees.feeReceiptEmail.key]: fees.feeReceiptEmail,
  [fees.fineWaiverRequestEmail.key]: fees.fineWaiverRequestEmail,
  [fees.fineWaiverApprovedEmail.key]: fees.fineWaiverApprovedEmail,
  
  // Student templates
  [students.studentWelcomeEmail.key]: students.studentWelcomeEmail,
  [students.leaveSubmittedEmail.key]: students.leaveSubmittedEmail,
  [students.leaveStatusEmail.key]: students.leaveStatusEmail,
  [students.passwordResetEmail.key]: students.passwordResetEmail,
};

export default defaultTemplates;
