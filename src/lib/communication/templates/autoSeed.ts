import { logger } from '@/lib/logger';
import { seedDefaultTemplates } from './seedTemplates';

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
    // Run seed process silently (checks DB for changes internally)
    const seedResult = await seedDefaultTemplates();

    // Only log if there were actual changes
    if (seedResult.created > 0) {
      logger.info('Communication templates created', {
        created: seedResult.created,
      });
    } else if (seedResult.updated > 0) {
      logger.info('Communication templates updated', {
        updated: seedResult.updated,
      });
    } else if (seedResult.errors.length > 0) {
      logger.error('Communication template errors', {
        errors: seedResult.errors.length,
      });
    }
    // If all skipped (no changes), log nothing

    isTemplatesInitialized = true;
  } catch (error) {
    logger.error('Error during template auto-seed:', { error: String(error) });
    // Don't throw - app should continue even if seeding fails
    isTemplatesInitialized = true;
  }
}
