import { createHash, randomBytes } from 'node:crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env';
import type { AuthPayload, SafeUser, User } from './auth.service';

export function toSafeUser(user: User): SafeUser {
  const { password_hash: _, ...safe } = user;
  return safe;
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateRefreshToken(): string {
  return randomBytes(48).toString('hex');
}

export function signAccessToken(user: SafeUser): string {
  const payload: AuthPayload = {
    sub: user.id,
    username: user.username,
    role: user.role,
  };

  return jwt.sign(
    payload,
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] },
  );
}
