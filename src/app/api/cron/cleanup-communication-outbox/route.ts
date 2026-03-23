import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * Cleanup Configuration
 */
const CLEANUP_CONFIG = {
  // Retention periods in days
  sentRetentionDays: parseInt(process.env.COMMUNICATION_OUTBOX_SENT_RETENTION_DAYS || '30'),
  deadLetterRetentionDays: parseInt(process.env.COMMUNICATION_OUTBOX_DEAD_LETTER_RETENTION_DAYS || '7'),
  failedRetentionDays: parseInt(process.env.COMMUNICATION_OUTBOX_FAILED_RETENTION_DAYS || '14'),
  
  // Batch processing
  batchSize: parseInt(process.env.COMMUNICATION_OUTBOX_CLEANUP_BATCH_SIZE || '1000'),
  
  // Archive settings
  enableArchive: process.env.COMMUNICATION_OUTBOX_ENABLE_ARCHIVE === 'true',
  archiveRetentionDays: parseInt(process.env.COMMUNICATION_OUTBOX_ARCHIVE_RETENTION_DAYS || '365'),
};

interface CleanupStats {
  sentDeleted: number;
  deadLetterDeleted: number;
  failedDeleted: number;
  archivedDeleted: number;
  totalDeleted: number;
  errors: string[];
  duration: number;
}

/**
 * Archive records before deletion (for compliance)
 */
async function archiveRecords(records: any[], archiveType: string) {
  if (!CLEANUP_CONFIG.enableArchive) {
    return 0;
  }

  try {
    // Create archive table if it doesn't exist
    await schoolPrisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "school"."communication_outbox_archive" (
        LIKE "school"."communication_outbox" INCLUDING ALL
      );
    `;

    // Insert records into archive table
    const archiveData = records.map(record => ({
      ...record,
      archivedAt: new Date(),
      archiveType,
    }));

    await (schoolPrisma as any).communicationOutboxArchive.createMany({
      data: archiveData,
      skipDuplicates: true,
    });

    return records.length;
  } catch (error) {
    logger.error('Failed to archive communication outbox records', { error, archiveType, recordCount: records.length });
    throw error;
  }
}

/**
 * Delete old records by status and date
 */
async function deleteOldRecords(status: string, daysOld: number, archiveType: string) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  try {
    // Find records to delete
    const recordsToDelete = await (schoolPrisma as any).communicationOutbox.findMany({
      where: {
        status,
        createdAt: {
          lt: cutoffDate,
        },
      },
      take: CLEANUP_CONFIG.batchSize,
      select: {
        id: true,
        schoolId: true,
        channel: true,
        templateKey: true,
        recipientUserId: true,
        recipientAddress: true,
        payloadJson: true,
        dedupeKey: true,
        status: true,
        attemptCount: true,
        nextAttemptAt: true,
        lastError: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (recordsToDelete.length === 0) {
      return 0;
    }

    // Archive if enabled
    if (CLEANUP_CONFIG.enableArchive) {
      await archiveRecords(recordsToDelete, archiveType);
    }

    // Delete records
    const deleteResult = await (schoolPrisma as any).communicationOutbox.deleteMany({
      where: {
        id: {
          in: recordsToDelete.map((r: any) => r.id),
        },
      },
    });

    return deleteResult.count;
  } catch (error) {
    logger.error(`Failed to delete ${status} communication outbox records`, { error, daysOld: daysOld });
    throw error;
  }
}

/**
 * Clean up old archive records
 */
async function cleanupOldArchives() {
  if (!CLEANUP_CONFIG.enableArchive) {
    return 0;
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - CLEANUP_CONFIG.archiveRetentionDays);

  try {
    const deleteResult = await schoolPrisma.$executeRaw`
      DELETE FROM "school"."communication_outbox_archive" 
      WHERE "archivedAt" < ${cutoffDate}
    `;
    
    return deleteResult;
  } catch (error) {
    logger.error('Failed to cleanup old archive records', { error });
    throw error;
  }
}

/**
 * Get cleanup statistics
 */
async function getCleanupStats() {
  const now = new Date();
  const sentCutoff = new Date();
  sentCutoff.setDate(sentCutoff.getDate() - CLEANUP_CONFIG.sentRetentionDays);
  
  const deadLetterCutoff = new Date();
  deadLetterCutoff.setDate(deadLetterCutoff.getDate() - CLEANUP_CONFIG.deadLetterRetentionDays);
  
  const failedCutoff = new Date();
  failedCutoff.setDate(failedCutoff.getDate() - CLEANUP_CONFIG.failedRetentionDays);

  try {
    const [
      totalRecords,
      sentRecords,
      deadLetterRecords,
      failedRecords,
      pendingRecords,
      processingRecords,
      sentOldCount,
      deadLetterOldCount,
      failedOldCount,
      archiveCount,
    ] = await Promise.all([
      (schoolPrisma as any).communicationOutbox.count(),
      (schoolPrisma as any).communicationOutbox.count({ where: { status: 'sent' } }),
      (schoolPrisma as any).communicationOutbox.count({ where: { status: 'dead_letter' } }),
      (schoolPrisma as any).communicationOutbox.count({ where: { status: 'failed' } }),
      (schoolPrisma as any).communicationOutbox.count({ where: { status: 'pending' } }),
      (schoolPrisma as any).communicationOutbox.count({ where: { status: 'processing' } }),
      (schoolPrisma as any).communicationOutbox.count({
        where: {
          status: 'sent',
          createdAt: { lt: sentCutoff },
        },
      }),
      (schoolPrisma as any).communicationOutbox.count({
        where: {
          status: 'dead_letter',
          createdAt: { lt: deadLetterCutoff },
        },
      }),
      (schoolPrisma as any).communicationOutbox.count({
        where: {
          status: 'failed',
          createdAt: { lt: failedCutoff },
        },
      }),
      CLEANUP_CONFIG.enableArchive 
        ? schoolPrisma.$queryRaw`SELECT COUNT(*) as count FROM "school"."communication_outbox_archive"`
        : Promise.resolve([{ count: 0 }]),
    ]);

    return {
      total: totalRecords,
      byStatus: {
        sent: sentRecords,
        dead_letter: deadLetterRecords,
        failed: failedRecords,
        pending: pendingRecords,
        processing: processingRecords,
      },
      eligibleForDeletion: {
        sent: sentOldCount,
        dead_letter: deadLetterOldCount,
        failed: failedOldCount,
        total: sentOldCount + deadLetterOldCount + failedOldCount,
      },
      archive: {
        enabled: CLEANUP_CONFIG.enableArchive,
        count: CLEANUP_CONFIG.enableArchive ? (archiveCount as any)[0]?.count || 0 : 0,
      },
      config: CLEANUP_CONFIG,
    };
  } catch (error) {
    logger.error('Failed to get cleanup stats', { error });
    throw error;
  }
}

/**
 * Main cleanup function
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Auth check
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats: CleanupStats = {
      sentDeleted: 0,
      deadLetterDeleted: 0,
      failedDeleted: 0,
      archivedDeleted: 0,
      totalDeleted: 0,
      errors: [],
      duration: 0,
    };

    // Delete old sent records
    try {
      stats.sentDeleted = await deleteOldRecords('sent', CLEANUP_CONFIG.sentRetentionDays, 'sent_retention');
    } catch (error) {
      stats.errors.push(`Failed to delete sent records: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Delete old dead_letter records
    try {
      stats.deadLetterDeleted = await deleteOldRecords('dead_letter', CLEANUP_CONFIG.deadLetterRetentionDays, 'dead_letter_retention');
    } catch (error) {
      stats.errors.push(`Failed to delete dead_letter records: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Delete old failed records
    try {
      stats.failedDeleted = await deleteOldRecords('failed', CLEANUP_CONFIG.failedRetentionDays, 'failed_retention');
    } catch (error) {
      stats.errors.push(`Failed to delete failed records: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Clean up old archives
    try {
      stats.archivedDeleted = await cleanupOldArchives();
    } catch (error) {
      stats.errors.push(`Failed to cleanup archives: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    stats.totalDeleted = stats.sentDeleted + stats.deadLetterDeleted + stats.failedDeleted + stats.archivedDeleted;
    stats.duration = Date.now() - startTime;

    // Log cleanup results
    logger.info('Communication outbox cleanup completed', {
      ...stats,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
      config: CLEANUP_CONFIG,
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Communication outbox cleanup failed', { error, duration });
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration,
    }, { status: 500 });
  }
}

/**
 * Get cleanup statistics and status
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await getCleanupStats();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
    });

  } catch (error) {
    logger.error('Failed to get cleanup stats', { error });
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
