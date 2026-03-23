import { sendSchoolEmail } from '@/lib/email';
import { logger } from '@/lib/logger';
import { schoolPrisma } from '@/lib/prisma';

type ProcessCommunicationOutboxInput = {
  limit?: number;
  schoolId?: string | null;
};

function getNextAttemptDate(attemptCount: number) {
  const minutes = Math.min(60, Math.max(1, 2 ** Math.max(0, attemptCount - 1)));
  return new Date(Date.now() + minutes * 60 * 1000);
}

export async function processCommunicationOutboxBatch(input: ProcessCommunicationOutboxInput = {}) {
  const limit = Math.min(100, Math.max(1, input.limit || 25));
  const now = new Date();

  const items = await (schoolPrisma as any).communicationOutbox.findMany({
    where: {
      ...(input.schoolId ? { schoolId: input.schoolId } : {}),
      status: { in: ['pending', 'failed'] },
      OR: [
        { nextAttemptAt: null },
        { nextAttemptAt: { lte: now } },
      ],
    },
    orderBy: [{ nextAttemptAt: 'asc' }, { createdAt: 'asc' }],
    take: limit,
  });

  const summary = {
    scanned: items.length,
    sent: 0,
    failed: 0,
    deadLetter: 0,
    skipped: 0,
  };

  for (const item of items) {
    const claim = await (schoolPrisma as any).communicationOutbox.updateMany({
      where: {
        id: item.id,
        status: { in: ['pending', 'failed'] },
      },
      data: {
        status: 'processing',
      },
    });

    if (!claim.count) {
      summary.skipped += 1;
      continue;
    }

    try {
      const payload = JSON.parse(item.payloadJson || '{}');

      if (item.channel === 'email') {
        const result = await sendSchoolEmail({
          to: payload.to || item.recipientAddress,
          subject: payload.subject,
          html: payload.html,
          schoolId: item.schoolId || undefined,
          attachments: payload.attachments,
        });

        if (!result?.success) {
          throw new Error(result?.error || 'Email delivery failed');
        }
      }

      await (schoolPrisma as any).communicationOutbox.update({
        where: { id: item.id },
        data: {
          status: 'sent',
          attemptCount: (item.attemptCount || 0) + 1,
          nextAttemptAt: null,
          lastError: null,
        },
      });

      summary.sent += 1;
    } catch (error) {
      const nextAttemptCount = (item.attemptCount || 0) + 1;
      const nextStatus = nextAttemptCount >= 5 ? 'dead_letter' : 'failed';

      await (schoolPrisma as any).communicationOutbox.update({
        where: { id: item.id },
        data: {
          status: nextStatus,
          attemptCount: nextAttemptCount,
          nextAttemptAt: nextStatus === 'dead_letter' ? null : getNextAttemptDate(nextAttemptCount),
          lastError: error instanceof Error ? error.message : 'Unknown outbox processing error',
        },
      });

      if (nextStatus === 'dead_letter') {
        summary.deadLetter += 1;
      } else {
        summary.failed += 1;
      }

      logger.error('Communication outbox processing failed', {
        error,
        outboxId: item.id,
        channel: item.channel,
        schoolId: item.schoolId,
      });
    }
  }

  return summary;
}
