import type { NextFunction, Request, Response } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const time = new Date().toLocaleTimeString('th-TH');
    console.log(`[${time}] ${req.method} ${req.originalUrl} → ${res.statusCode} (${ms}ms)`);
  });
  next();
}
