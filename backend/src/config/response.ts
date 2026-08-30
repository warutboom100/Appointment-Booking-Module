import type { Response } from 'express';

export type PageMeta = { page: number; limit: number; total: number; totalPages: number };

// ==================== Success handlers ====================
export const ok = <T>(res: Response, data: T) => res.status(200).json({ data });

export const created = <T>(res: Response, data: T) => res.status(201).json({ data });

export const list = <T>(res: Response, data: T[], meta: PageMeta) =>
  res.status(200).json({ data, meta });

export const noContent = (res: Response) => res.status(204).send();

// ==================== Error type ====================
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errors = {
  validation: (message = 'ข้อมูลที่ส่งมาไม่ถูกต้อง') =>
    new AppError(400, 'VALIDATION_ERROR', message),
  unauthorized: (message = 'ไม่ได้รับอนุญาต กรุณาเข้าสู่ระบบ') =>
    new AppError(401, 'UNAUTHORIZED', message),
  forbidden: (message = 'ไม่มีสิทธิ์เข้าถึงข้อมูลหรือดำเนินการนี้') =>
    new AppError(403, 'FORBIDDEN', message),
  notFound: (message = 'ไม่พบข้อมูลที่ต้องการ') => new AppError(404, 'NOT_FOUND', message),
  duplicate: (message = 'ข้อมูลนี้มีอยู่แล้วในระบบ') => new AppError(409, 'DUPLICATE', message),
  conflict: (message = 'เกิดข้อขัดแย้งของข้อมูล') => new AppError(409, 'CONFLICT', message),
  internal: (message = 'เกิดข้อผิดพลาดภายในระบบ') => new AppError(500, 'INTERNAL_ERROR', message),
};
