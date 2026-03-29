/**
 * Communication Templates - Main Entry Point
 * 
 * World-class centralized communication template system for School ERP.
 * 
 * Features:
 * - High-class email templates with professional design
 * - Variable substitution with helpers (formatDate, formatCurrency, etc.)
 * - School-specific branding and colors
 * - Global defaults with school overrides
 * - Direct outbox integration
 * 
 * Quick Start:
 * ```typescript
 * import { templateService } from '@/lib/communication';
 * 
 * // Send templated email
 * await templateService.sendEmail({
 *   templateKey: 'student_welcome_email',
 *   schoolId: 'school_123',
 *   to: 'parent@example.com',
 *   variables: {
 *     studentName: 'John Doe',
 *     admissionNo: 'ADM001',
 *     className: 'Class 5-A',
 *     academicYear: '2024-25'
 *   }
 * });
 * ```
 * 
 * @module CommunicationTemplates
 */

// Core exports
export { templateService } from './templates/TemplateService';
export { default as TemplateEngine } from './templates/TemplateEngine';
export { default as EmailComponents } from './templates/components/EmailComponents';
export { defaultTemplates } from './templates/defaults/index';

// Types
export type {
  SendTemplateEmailParams,
  RenderTemplateParams,
  TemplateResult,
  SchoolInfo
} from './templates/TemplateService';

export type {
  TemplateVariable,
  TemplateVariableSchema,
  RenderOptions
} from './templates/TemplateEngine';

export type {
  SchoolBranding,
  EmailStyles,
  TableRow
} from './templates/components/EmailComponents';

export type { DefaultTemplate } from './templates/defaults/index';

// Seed utilities
export {
  seedDefaultTemplates,
  listTemplates,
  clearDefaultTemplates
} from './templates/seedTemplates';

/**
 * Convenience re-export of template service
 */
import { templateService } from './templates/TemplateService';
export default templateService;
