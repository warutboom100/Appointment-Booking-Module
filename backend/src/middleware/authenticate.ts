import type { NextFunction, Request, Response } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { verifyAccessToken, type UserRole } from '../api/auth/auth.service';
import { env } from '../config/env';
import { errors } from '../config/response';

const VALID_ROLES: UserRole[] = ['admin', 'doctor', 'receptionist'];

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.header('Authorization');
  if (!header) return next(errors.unauthorized('กรุณาระบุ Authorization header'));

  // Development & Test Mode: Support ApiKey + Dev Role/User Impersonation for Apidog / Postman
  if (env.NODE_ENV !== 'production' && header.startsWith('ApiKey ')) {
    const key = header.slice(7);
    if (!constantTimeEqual(key, env.API_KEY)) {
      return next(errors.unauthorized('API Key ไม่ถูกต้อง'));
    }

    const roleHeader = req.header('X-Role') as UserRole | undefined;
    const role: UserRole = roleHeader && VALID_ROLES.includes(roleHeader) ? roleHeader : 'admin';
    const userId = req.header('X-User-Id') || '00000000-0000-0000-0000-000000000000';
    const username = req.header('X-Username') || `dev-${role}`;

    req.user = {
      sub: userId,
      username,
      role,
    };
    return next();
  }

  // Production & Standard Token Auth: Bearer JWT
  if (header.startsWith('Bearer ')) {
    const token = header.slice(7);
    try {
      const payload = verifyAccessToken(token);
      req.user = payload;
      return next();
    } catch (err) {
      return next(err);
    }
  }

  return next(errors.unauthorized('รูปแบบ Authorization header ไม่ถูกต้อง'));
}
