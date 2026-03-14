import { prisma } from './prisma';

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
    await (prisma as any).auditLog.create({
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
    console.error('Audit log error:', err);
  }
}
