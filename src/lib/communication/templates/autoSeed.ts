import { schoolPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { defaultTemplates, DefaultTemplate } from './defaults/index';

let isTemplatesInitialized = false;

/**
 * Ensure default communication templates exist in database
 * Auto-seeds on app start if templates are missing
 */
export async function ensureDefaultTemplates() {
  // Prevent multiple initializations in the same process
  if (isTemplatesInitialized) {
    return;
  }

  try {
    logger.info('Checking default communication templates...');

    // Check if any templates exist
    const count = await (schoolPrisma as any).CommunicationTemplate.count({
      where: { isDefault: true }
    });

    if (count > 0) {
      logger.info(`Found ${count} default templates in database, skipping auto-seed`);
      isTemplatesInitialized = true;
      return;
    }

    logger.info('No default templates found, auto-seeding...');

    const results = [];

    for (const [key, templateData] of Object.entries(defaultTemplates)) {
      const template = templateData as DefaultTemplate;
      try {
        const created = await (schoolPrisma as any).CommunicationTemplate.create({
          data: {
            schoolId: null,
            category: template.category,
            type: template.type,
            key: template.key,
            name: template.name,
            description: template.description,
            subject: template.subject,
            htmlBody: template.htmlBody,
            textBody: template.textBody,
            smsBody: template.smsBody,
            variablesSchema: template.variablesSchema,
            primaryColor: template.primaryColor,
            accentColor: template.accentColor,
            isDefault: true,
            isActive: true,
            version: template.version || 1
          }
        });
        results.push({ key: template.key, id: created.id });
      } catch (err) {
        logger.error(`Failed to seed template ${key}:`, { error: String(err) });
      }
    }

    logger.info(`Auto-seeded ${results.length} default templates`, {
      templates: results.map(r => r.key)
    });

    isTemplatesInitialized = true;
  } catch (error) {
    logger.error('Error during template auto-seed:', { error: String(error) });
    // Don't throw - app should continue even if seeding fails
    isTemplatesInitialized = true;
  }
}
