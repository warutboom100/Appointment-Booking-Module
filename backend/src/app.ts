import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { notFound } from './middleware/not-found';
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/request-logger';
import { authRouter } from './api/auth/auth.router';
import { departmentRouter } from './api/departments/department.router';
import { doctorRouter } from './api/doctors/doctor.router';
import { db } from './knex/db';

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '10kb' }));

if (env.NODE_ENV !== 'test') {
  app.use(requestLogger);
  app.use(rateLimit({ windowMs: 60_000, limit: 100 }));
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

if (env.NODE_ENV !== 'test') {
  const authLimiter = rateLimit({
    windowMs: 60_000,
    limit: 10,
    message: { error: { code: 'TOO_MANY_REQUESTS', message: 'คำขอมากเกินไป กรุณารอสักครู่' } },
  });
  app.use(`${env.API_PREFIX}/auth`, authLimiter);
}

app.use(`${env.API_PREFIX}/auth`, authRouter);
app.use(`${env.API_PREFIX}/departments`, departmentRouter);
app.use(`${env.API_PREFIX}/doctors`, doctorRouter);

app.use(notFound);
app.use(errorHandler);

if (env.NODE_ENV !== 'test') {
  const server = app.listen(env.PORT, () => {
    console.log(`API listening on http://localhost:${env.PORT}`);
  });

  const shutdown = () => {
    console.log('Shutting down...');
    server.close(() => db.destroy().then(() => process.exit(0)));
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
