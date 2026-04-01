/**
 * Seed Default Communication Templates
 * 
 * Seeds the database with world-class default templates for all communication types.
 * Run this script to populate the CommunicationTemplate table with initial templates.
 * 
 * Usage:
 *   npx ts-node src/lib/communication/templates/seedTemplates.ts
 * 
 * @module SeedTemplates
 */

import { schoolPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { defaultTemplates } from './defaults/index';

interface SeedResult {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

/**
 * Seed default templates into the database
 */
async function seedDefaultTemplates(): Promise<SeedResult> {
  const prisma = schoolPrisma as any;
  const result: SeedResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: []
  };

  for (const [key, template] of Object.entries(defaultTemplates)) {
    try {
      // Check if template already exists
      const existing = await prisma.CommunicationTemplate.findFirst({
        where: {
          schoolId: null,
          key: template.key
        }
      });

      if (existing) {
        // Update only if version is different OR if isDefault needs to be fixed
        const needsUpdate = existing.version !== template.version || 
                           (!existing.isDefault && template.isDefault);
        
        if (needsUpdate) {
          await prisma.CommunicationTemplate.update({
            where: { id: existing.id },
            data: {
              category: template.category,
              type: template.type,
              name: template.name,
              description: template.description,
              subject: template.subject,
              htmlBody: template.htmlBody,
              textBody: template.textBody,
              smsBody: template.smsBody,
              variablesSchema: template.variablesSchema,
              primaryColor: template.primaryColor,
              accentColor: template.accentColor,
              isDefault: template.isDefault,
              isActive: true,
              version: template.version || 1
            }
          });
          logger.info(`Updated template: ${template.key}`);
          result.updated++;
        } else {
          logger.debug(`Skipped unchanged template: ${template.key}`);
          result.skipped++;
        }
      } else {
        // Create new template
        await prisma.CommunicationTemplate.create({
          data: {
            schoolId: null, // Global template
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
        logger.info(`Created template: ${template.key}`);
        result.created++;
      }
    } catch (error) {
      const errorMsg = `Failed to seed template ${template.key}: ${error instanceof Error ? error.message : String(error)}`;
      logger.error(errorMsg);
      result.errors.push(errorMsg);
    }
  }

  return result;
}

/**
 * List all available templates (for verification)
 */
async function listTemplates(): Promise<void> {
  const prisma = schoolPrisma as any;
  
  const templates = await prisma.CommunicationTemplate.findMany({
    where: { isActive: true },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
    select: {
      key: true,
      name: true,
      category: true,
      type: true,
      isDefault: true,
      schoolId: true,
      version: true
    }
  });

  const grouped = templates.reduce((acc: any, t: any) => {
    const group = t.category;
    if (!acc[group]) acc[group] = [];
    acc[group].push(t);
    return acc;
  }, {});

  for (const [category, items] of Object.entries(grouped)) {
    // Process category templates
    (items as any[]).forEach(t => {
      const scope = t.schoolId ? 'School' : (t.isDefault ? 'Global' : 'Custom');
      // Process template
    });
  }
}

/**
 * Clear all default templates (for reset)
 */
async function clearDefaultTemplates(): Promise<{ deleted: number }> {
  const prisma = schoolPrisma as any;
  
  const result = await prisma.CommunicationTemplate.deleteMany({
    where: {
      schoolId: null,
      isDefault: true
    }
  });

  logger.info(`Deleted ${result.count} default templates`);
  return { deleted: result.count };
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'seed';

  try {
    switch (command) {
      case 'seed':
        const seedResult = await seedDefaultTemplates();
        console.log('\n✅ Template seed completed:');
        console.log(`   Created: ${seedResult.created}`);
        console.log(`   Updated: ${seedResult.updated}`);
        console.log(`   Skipped: ${seedResult.skipped}`);
        if (seedResult.errors.length > 0) {
          console.log(`   Errors: ${seedResult.errors.length}`);
          seedResult.errors.forEach(e => console.log(`     - ${e}`));
        }
        break;

      case 'list':
        await listTemplates();
        break;

      case 'clear':
        const clearResult = await clearDefaultTemplates();
        console.log(`\n🗑️  Cleared ${clearResult.deleted} default templates`);
        break;

      case 'reset':
        await clearDefaultTemplates();
        const resetResult = await seedDefaultTemplates();
        console.log('\n🔄 Reset completed:');
        console.log(`   Created: ${resetResult.created}`);
        console.log(`   Updated: ${resetResult.updated}`);
        break;

      default:
        console.log(`
Usage: npx ts-node seedTemplates.ts [command]

Commands:
  seed   - Seed default templates (default)
  list   - List all templates
  clear  - Remove all default templates
  reset  - Clear and re-seed templates
        `);
    }
  } catch (error) {
    logger.error('Seed script failed', { error });
    process.exit(1);
  } finally {
    await (schoolPrisma as any).$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { seedDefaultTemplates, listTemplates, clearDefaultTemplates };
