import { saasPrisma } from './prisma';
import { logger } from './logger';

export async function logAuditAction({
  actorEmail,
  action,
  target,
  targetName,
  details,
  ipAddress,
}: {
  actorEmail: string;
  action: string;
  target?: string;
  targetName?: string;
  details?: Record<string, any>;
  ipAddress?: string;
}) {
  try {
    await (saasPrisma as any).auditLog.create({
      data: {
        actorEmail,
        action,
        target,
        targetName,
        details: details ? JSON.stringify(details) : null,
        ipAddress,
      },
    });
  } catch (err) {
    logger.error('Audit log error', { error: err, actorEmail, action, target });
  }
}
