import { prisma } from '../../prisma/client.js';
import { logger } from '../../utils/logger.js';

export interface CreateAuditLogParams {
  actorId?: string | null;
  actorRole?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  previousState?: any;
  newState?: any;
  ipAddress?: string | null;
  reason?: string | null;
}

import { Prisma } from '@prisma/client';

export class AuditService {
  public static async log(
    params: CreateAuditLogParams,
    tx?: Prisma.TransactionClient
  ): Promise<void> {
    try {
      const client = tx || prisma;
      await client.auditLog.create({
        data: {
          actorId: params.actorId || null,
          actorRole: params.actorRole || null,
          action: params.action,
          targetType: params.targetType,
          targetId: params.targetId || null,
          previousStateJson: params.previousState ? JSON.stringify(params.previousState) : null,
          newStateJson: params.newState ? JSON.stringify(params.newState) : null,
          ipAddress: params.ipAddress || null,
          reason: params.reason || null,
        },
      });

      logger.info(`[AUDIT] Action: ${params.action} on ${params.targetType}:${params.targetId} by ${params.actorId || 'SYSTEM'}`);
    } catch (error) {
      logger.error('Failed to create audit log entry:', error);
    }
  }

  public static async getLogs(query: { targetType?: string; targetId?: string; actorId?: string; limit?: number; offset?: number }) {
    const where: any = {};
    if (query.targetType) where.targetType = query.targetType;
    if (query.targetId) where.targetId = query.targetId;
    if (query.actorId) where.actorId = query.actorId;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: query.limit || 50,
        skip: query.offset || 0,
        include: {
          actor: {
            select: { id: true, username: true, email: true, role: true },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
  }
}
