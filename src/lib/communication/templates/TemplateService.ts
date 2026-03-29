/**
 * Template Service - Main API for Communication Templates
 * 
 * Provides a simple API for rendering and sending templated communications.
 * Features:
 * - School-specific template overrides
 * - Global default templates
 * - Variable validation
 * - School branding integration
 * - Direct outbox integration
 * 
 * @module TemplateService
 */

import { schoolPrisma, saasPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { queueCommunicationOutbox } from '@/lib/communicationOutbox';
import TemplateEngine, { TemplateVariableSchema, RenderOptions } from './TemplateEngine';
import EmailComponents, { SchoolBranding, EmailStyles } from './components/EmailComponents';
import { defaultTemplates } from './defaults/index';

export interface SendTemplateEmailParams {
  templateKey: string;
  schoolId?: string;
  to: string;
  recipientUserId?: string;
  variables: Record<string, any>;
  dedupeKey?: string;
  scheduledAt?: Date;
}

export interface RenderTemplateParams {
  templateKey: string;
  schoolId?: string;
  category?: 'email' | 'sms' | 'push';
  variables: Record<string, any>;
}

export interface TemplateResult {
  subject: string;
  html: string;
  text: string;
  templateKey: string;
  variablesUsed: string[];
  validation?: {
    valid: boolean;
    missing: string[];
    errors: string[];
  };
}

export interface SchoolInfo {
  id: string;
  name: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  primaryColor?: string;
}

/**
 * Fetch template from database
 * Falls back: school-specific → global default → hardcoded default
 */
async function fetchTemplate(
  key: string,
  schoolId?: string,
  category: string = 'email'
): Promise<{
  subject?: string;
  htmlBody?: string;
  textBody?: string;
  smsBody?: string;
  variablesSchema?: string;
  primaryColor?: string;
  accentColor?: string;
} | null> {
  const prisma = schoolPrisma as any;

  try {
    // 1. Try school-specific template
    if (schoolId) {
      const schoolTemplate = await prisma.CommunicationTemplate.findFirst({
        where: {
          schoolId,
          key,
          category,
          isActive: true
        }
      });

      if (schoolTemplate) {
        logger.debug('Found school-specific template', { key, schoolId });
        return schoolTemplate;
      }
    }

    // 2. Try global default template
    const globalTemplate = await prisma.CommunicationTemplate.findFirst({
      where: {
        schoolId: null,
        key,
        category,
        isActive: true,
        isDefault: true
      }
    });

    if (globalTemplate) {
      logger.debug('Found global template', { key });
      return globalTemplate;
    }

    // 3. Fall back to hardcoded default
    const hardcodedTemplate = defaultTemplates[key];
    if (hardcodedTemplate && hardcodedTemplate.category === category) {
      logger.debug('Using hardcoded default template', { key });
      return hardcodedTemplate;
    }

    logger.warn('Template not found', { key, schoolId, category });
    return null;
  } catch (error) {
    logger.error('Error fetching template', { error, key, schoolId });
    
    // Fallback to hardcoded on error
    const hardcodedTemplate = defaultTemplates[key];
    if (hardcodedTemplate && hardcodedTemplate.category === category) {
      return hardcodedTemplate;
    }
    
    return null;
  }
}

/**
 * Fetch school information for branding
 */
async function fetchSchoolInfo(schoolId?: string): Promise<SchoolInfo | null> {
  if (!schoolId) return null;

  try {
    const prisma = saasPrisma as any;
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        logo: true,
        address: true,
        phone: true,
        email: true
      }
    });

    if (!school) return null;

    // Get school settings for colors
    const schoolPrismaClient = schoolPrisma as any;
    const colorSetting = await schoolPrismaClient.SchoolSetting.findFirst({
      where: {
        schoolId,
        group: 'app_config',
        key: 'primary_color'
      }
    });

    return {
      ...school,
      primaryColor: colorSetting?.value || '#2563eb'
    };
  } catch (error) {
    logger.error('Error fetching school info', { error, schoolId });
    return null;
  }
}

/**
 * Render a template with variables
 */
export async function renderTemplate(params: RenderTemplateParams): Promise<TemplateResult | null> {
  const { templateKey, schoolId, category = 'email', variables } = params;

  // Fetch template
  const template = await fetchTemplate(templateKey, schoolId, category);
  if (!template) {
    logger.error('Template not found', { templateKey, schoolId, category });
    return null;
  }

  // Parse variable schema for validation
  const schema = TemplateEngine.parseSchema(template.variablesSchema);

  // Validate variables
  const validation = TemplateEngine.validate(variables, schema);

  // Merge school branding into variables
  const schoolInfo = await fetchSchoolInfo(schoolId);
  const brandedVariables = {
    ...variables,
    schoolName: schoolInfo?.name || variables.schoolName || 'School ERP',
    schoolLogo: schoolInfo?.logo || variables.schoolLogo,
    schoolAddress: schoolInfo?.address || variables.schoolAddress,
    schoolPhone: schoolInfo?.phone || variables.schoolPhone,
    schoolEmail: schoolInfo?.email || variables.schoolEmail,
    schoolId: schoolId || variables.schoolId,
    currentYear: new Date().getFullYear()
  };

  // Render templates
  const subject = template.subject 
    ? TemplateEngine.render(template.subject, brandedVariables)
    : 'Notification from School ERP';

  let html = '';
  
  if (category === 'email' && template.htmlBody) {
    // For email, wrap with branding if template doesn't include full HTML
    if (!template.htmlBody.includes('<!DOCTYPE')) {
      const branding: SchoolBranding = {
        name: schoolInfo?.name || brandedVariables.schoolName,
        logo: schoolInfo?.logo || brandedVariables.schoolLogo,
        address: schoolInfo?.address || brandedVariables.schoolAddress,
        phone: schoolInfo?.phone || brandedVariables.schoolPhone,
        email: schoolInfo?.email || brandedVariables.schoolEmail,
        primaryColor: template.primaryColor || schoolInfo?.primaryColor || '#2563eb',
        accentColor: template.accentColor || '#1e40af'
      };

      const content = TemplateEngine.render(template.htmlBody, brandedVariables);
      html = EmailComponents.build({
        branding,
        subject,
        content,
        footer: true
      });
    } else {
      // Template includes full HTML
      html = TemplateEngine.render(template.htmlBody, brandedVariables);
    }
  } else {
    html = template.htmlBody 
      ? TemplateEngine.render(template.htmlBody, brandedVariables)
      : '';
  }

  const text = template.textBody
    ? TemplateEngine.render(template.textBody, brandedVariables)
    : stripHtml(html);

  return {
    subject,
    html,
    text,
    templateKey,
    variablesUsed: TemplateEngine.extract(template.htmlBody || template.textBody || ''),
    validation
  };
}

/**
 * Send a templated email via the outbox
 */
export async function sendTemplateEmail(params: SendTemplateEmailParams): Promise<{
  success: boolean;
  message: string;
  outboxId?: string;
}> {
  const { templateKey, schoolId, to, recipientUserId, variables, dedupeKey, scheduledAt } = params;

  try {
    // Render template
    const rendered = await renderTemplate({
      templateKey,
      schoolId,
      category: 'email',
      variables
    });

    if (!rendered) {
      return {
        success: false,
        message: `Template "${templateKey}" not found`
      };
    }

    // Check validation
    if (rendered.validation && !rendered.validation.valid) {
      const missingVars = rendered.validation.missing.join(', ');
      return {
        success: false,
        message: `Missing required variables: ${missingVars}`
      };
    }

    // Queue to outbox
    await queueCommunicationOutbox({
      email: {
        to,
        subject: rendered.subject,
        html: rendered.html,
        schoolId,
        recipientUserId,
        templateKey,
        dedupeKey,
        scheduledAt
      }
    });

    logger.info('Template email queued', { templateKey, to, schoolId });

    return {
      success: true,
      message: 'Email queued successfully'
    };
  } catch (error) {
    logger.error('Failed to send template email', { error, templateKey, to, schoolId });
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Send a templated SMS via the outbox
 */
export async function sendTemplateSMS(params: {
  templateKey: string;
  schoolId?: string;
  to: string;
  recipientUserId?: string;
  variables: Record<string, any>;
  dedupeKey?: string;
  scheduledAt?: Date;
}): Promise<{ success: boolean; message: string }> {
  const { templateKey, schoolId, to, recipientUserId, variables, dedupeKey, scheduledAt } = params;

  try {
    // Fetch SMS template
    const template = await fetchTemplate(templateKey, schoolId, 'sms');
    
    if (!template || !template.smsBody) {
      return {
        success: false,
        message: `SMS template "${templateKey}" not found`
      };
    }

    // Render message
    const message = TemplateEngine.render(template.smsBody, variables);

    // Queue to outbox
    await queueCommunicationOutbox({
      sms: {
        to,
        message,
        schoolId: schoolId || null,
        recipientUserId: recipientUserId || null,
        templateKey,
        dedupeKey,
        scheduledAt
      }
    });

    logger.info('Template SMS queued', { templateKey, to, schoolId });

    return {
      success: true,
      message: 'SMS queued successfully'
    };
  } catch (error) {
    logger.error('Failed to send template SMS', { error, templateKey, to, schoolId });
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Preview a template (for admin panel)
 */
export async function previewTemplate(params: RenderTemplateParams): Promise<TemplateResult | null> {
  return renderTemplate(params);
}

/**
 * Get list of available templates for a school
 */
export async function getAvailableTemplates(
  schoolId?: string,
  category?: string
): Promise<Array<{
  key: string;
  name: string;
  description?: string;
  category: string;
  isDefault: boolean;
  isCustom: boolean;
}>> {
  const prisma = schoolPrisma as any;

  try {
    const templates = await prisma.CommunicationTemplate.findMany({
      where: {
        ...(schoolId !== undefined ? { OR: [{ schoolId }, { schoolId: null }] } : { schoolId: null }),
        ...(category ? { category } : {}),
        isActive: true
      },
      orderBy: [{ schoolId: 'desc' }, { name: 'asc' }]
    });

    // Also include hardcoded defaults not in DB
    const dbKeys = new Set(templates.map((t: any) => t.key));
    const hardcodedDefaults = Object.values(defaultTemplates)
      .filter((t: any) => !dbKeys.has(t.key))
      .map((t: any) => ({
        ...t,
        isDefault: true,
        isCustom: false
      }));

    return [...templates, ...hardcodedDefaults];
  } catch (error) {
    logger.error('Error fetching templates', { error, schoolId });
    return Object.values(defaultTemplates).map((t: any) => ({
      ...t,
      isDefault: true,
      isCustom: false
    }));
  }
}

/**
 * Strip HTML tags for plain text fallback
 */
function stripHtml(html: string): string {
  if (!html) return '';
  
  return html
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Template Service - Main export
 */
export const templateService = {
  render: renderTemplate,
  sendEmail: sendTemplateEmail,
  sendSMS: sendTemplateSMS,
  preview: previewTemplate,
  getTemplates: getAvailableTemplates,
  fetchTemplate,
  fetchSchoolInfo
};

export default templateService;
