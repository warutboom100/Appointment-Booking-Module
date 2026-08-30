import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '../api/auth/auth.service';
import { errors } from '../config/response';

export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return next(errors.unauthorized('กรุณาเข้าสู่ระบบก่อนทำรายการ'));
    }

    if (!allowedRoles.includes(user.role)) {
      return next(errors.forbidden('คุณไม่มีสิทธิ์ในการเข้าถึงหรือทำรายการนี้'));
    }

    return next();
  };
}
