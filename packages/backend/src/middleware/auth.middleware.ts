import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { env } from '../config/env';
import { isTokenBlacklisted } from '../config/redis';
import { AuthRequest, JwtPayload } from '../types';
import { sendError } from '../utils/response';

/**
 * Verifies JWT access token and attaches user to request.
 */
export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    sendError(res, 'Authentication required', 401);
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    // Check token blacklist (logout / rotation)
    if (payload.jti && (await isTokenBlacklisted(payload.jti))) {
      sendError(res, 'Token has been revoked', 401);
      return;
    }

    req.user = { id: payload.sub, email: payload.email, role: payload.role, jti: payload.jti };
    next();
  } catch {
    sendError(res, 'Invalid or expired token', 401);
  }
}

/**
 * Role-based access control guard.
 * Usage: requireRole(Role.ADMIN, Role.SUPER_ADMIN)
 */
export function requireRole(...roles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }
    if (!roles.includes(req.user.role)) {
      sendError(res, 'Insufficient permissions', 403);
      return;
    }
    next();
  };
}

/**
 * Admin-only middleware — also enforces IP whitelist per SRS §7.3.
 */
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    sendError(res, 'Authentication required', 401);
    return;
  }
  if (req.user.role !== Role.ADMIN && req.user.role !== Role.SUPER_ADMIN) {
    sendError(res, 'Admin access required', 403);
    return;
  }
  next();
}
