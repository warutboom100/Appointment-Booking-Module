import type { NextFunction, Request, Response } from 'express';
import { z, ZodError } from 'zod';
import { AppError } from '../config/response';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message } });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'ข้อมูลที่ส่งมาไม่ถูกต้อง',
        details: z.flattenError(err),
      },
    });
  }
  if (typeof err === 'object' && err !== null && (err as { code?: string }).code === '23505') {
    return res
      .status(409)
      .json({ error: { code: 'DUPLICATE', message: 'ข้อมูลนี้มีอยู่แล้วในระบบ' } });
  }
  console.error(err);
  return res
    .status(500)
    .json({ error: { code: 'INTERNAL_ERROR', message: 'เกิดข้อผิดพลาดภายในระบบ' } });
}
