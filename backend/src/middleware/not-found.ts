import type { NextFunction, Request, Response } from 'express';
import { errors } from '../config/response';

export function notFound(_req: Request, _res: Response, next: NextFunction) {
  next(errors.notFound('ไม่พบ endpoint ที่เรียก'));
}
