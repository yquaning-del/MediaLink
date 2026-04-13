import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../types';
import { logger } from '../config/logger';

/**
 * Appends to the immutable AuditLog table.
 * Used directly in service functions for business events.
 */
export async function writeAuditLog(params: {
  userId?: string;
  action: string;
  entity?: string;
  entityId?: string;
  oldValue?: unknown;
  newValue?: unknown;
  metadata?: unknown;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        oldValue: params.oldValue ? (params.oldValue as object) : undefined,
        newValue: params.newValue ? (params.newValue as object) : undefined,
        metadata: params.metadata ? (params.metadata as object) : undefined,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (err) {
    logger.error('Failed to write audit log', { error: err, params });
  }
}

/**
 * Express middleware that logs all mutating API requests to AuditLog.
 * Attaches to routes that need tracking (login, payment, admin actions).
 */
export function auditMiddleware(action: string) {
  return async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    await writeAuditLog({
      userId: req.user?.id,
      action,
      metadata: { method: req.method, url: req.originalUrl },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    next();
  };
}
