import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../../knex/db';
import { env } from '../../config/env';
import { errors } from '../../config/response';
import { now } from '../../utils/time';
import { toSafeUser, hashToken, generateRefreshToken, signAccessToken } from './auth.fn';
import type { RegisterInput } from './auth.schema';

export type UserRole = 'admin' | 'doctor' | 'receptionist';

export interface User {
  id: string;
  username: string;
  password_hash: string;
  name: string;
  role: UserRole;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export type SafeUser = Omit<User, 'password_hash'>;

export interface AuthPayload {
  sub: string;
  username: string;
  role: UserRole;
}

const refreshExpiry = () =>
  new Date(Date.now() + env.REFRESH_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000);

async function purgeExpired(): Promise<void> {
  await db('refresh_tokens').where('expires_at', '<', new Date()).del();
}

async function issueRefreshToken(userId: string): Promise<string> {
  const token = generateRefreshToken();
  await db('refresh_tokens').insert({
    user_id: userId,
    token_hash: hashToken(token),
    expires_at: refreshExpiry(),
    created_at: now(),
  });
  return token;
}

export async function register(input: RegisterInput): Promise<SafeUser> {
  const existing = await db<User>('users').where({ username: input.username }).first();
  if (existing) throw errors.duplicate('ชื่อผู้ใช้นี้ถูกใช้งานแล้ว');

  const passwordHash = await bcrypt.hash(input.password, 12);
  const timestamp = now();

  const [user] = await db<User>('users')
    .insert({
      username: input.username,
      password_hash: passwordHash,
      name: input.name,
      role: input.role ?? 'receptionist',
      is_active: true,
      created_at: timestamp,
      updated_at: timestamp,
    })
    .returning('*');

  return toSafeUser(user);
}

export async function login(username: string, password: string) {
  const user = await db<User>('users').where({ username }).first();
  if (!user) throw errors.unauthorized('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');

  if (!user.is_active) {
    throw errors.unauthorized('บัญชีผู้ใช้นี้ถูกระงับการใช้งาน');
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw errors.unauthorized('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');

  await purgeExpired();
  const safeUser = toSafeUser(user);
  const accessToken = signAccessToken(safeUser);
  const refreshToken = await issueRefreshToken(user.id);

  return { accessToken, refreshToken, user: safeUser };
}

export async function refresh(refreshToken: string) {
  const row = await db('refresh_tokens')
    .where({ token_hash: hashToken(refreshToken) })
    .where('expires_at', '>', new Date())
    .first();

  if (!row) throw errors.unauthorized('Refresh token ไม่ถูกต้องหรือหมดอายุ');

  const user = await db<User>('users').where({ id: row.user_id }).first();
  if (!user || !user.is_active) throw errors.unauthorized('ไม่พบผู้ใช้หรือบัญชีถูกระงับการใช้งาน');

  await db('refresh_tokens').where({ id: row.id }).del();
  await purgeExpired();
  const newRefreshToken = await issueRefreshToken(user.id);

  return { accessToken: signAccessToken(toSafeUser(user)), refreshToken: newRefreshToken };
}

export async function logout(refreshToken: string) {
  const hash = hashToken(refreshToken);
  await db('refresh_tokens').where({ token_hash: hash }).del();
}

export function verifyAccessToken(token: string): AuthPayload {
  try {
    return jwt.verify(token, env.JWT_SECRET) as AuthPayload;
  } catch {
    throw errors.unauthorized('Token ไม่ถูกต้องหรือหมดอายุ');
  }
}
