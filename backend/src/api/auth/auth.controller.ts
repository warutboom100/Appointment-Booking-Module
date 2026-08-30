import type { CookieOptions, Request, Response } from 'express';
import { ok, created, errors } from '../../config/response';
import { env } from '../../config/env';
import * as service from './auth.service';
import { registerSchema, loginSchema } from './auth.schema';

const REFRESH_COOKIE = 'refresh_token';
const cookiePath = `${env.API_PREFIX}/auth`;

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: cookiePath,
  maxAge: env.REFRESH_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000,
};

export async function register(req: Request, res: Response) {
  const input = registerSchema.parse(req.body);
  const user = await service.register(input);
  created(res, user);
}

export async function login(req: Request, res: Response) {
  const { username, password } = loginSchema.parse(req.body);
  const { accessToken, refreshToken, user } = await service.login(username, password);
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
  ok(res, { accessToken, user });
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
  if (!token) throw errors.unauthorized('ไม่พบ refresh token');
  const { accessToken, refreshToken } = await service.refresh(token);
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions); // rotate → set cookie ใหม่
  ok(res, { accessToken });
}

export async function logout(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
  if (token) await service.logout(token);
  res.clearCookie(REFRESH_COOKIE, { path: cookiePath });
  ok(res, { message: 'ออกจากระบบสำเร็จ' });
}

export async function me(req: Request, res: Response) {
  if (!req.user) throw errors.unauthorized();
  ok(res, { user: req.user });
}
