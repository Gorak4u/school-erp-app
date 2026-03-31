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
    logger.info('Checking default communication templates...');

    // Reconcile all default templates from code into the database.
    // This backfills missing templates and refreshes outdated ones.
    const seedResult = await seedDefaultTemplates();

    // Only log if there were actual changes (not just updates)
    if (seedResult.created > 0 || seedResult.errors.length > 0) {
      logger.info('Default communication templates reconciled', {
        created: seedResult.created,
        updated: seedResult.updated,
        skipped: seedResult.skipped,
        errors: seedResult.errors.length,
      });
    } else if (seedResult.updated > 0) {
      // Silently skip logging if only updates happened (templates already exist)
      logger.debug('Default communication templates already exist', {
        updated: seedResult.updated,
        skipped: seedResult.skipped,
      });
    }

    isTemplatesInitialized = true;
  } catch (error) {
    logger.error('Error during template auto-seed:', { error: String(error) });
    // Don't throw - app should continue even if seeding fails
    isTemplatesInitialized = true;
  }
}
