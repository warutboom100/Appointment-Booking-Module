import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  API_PREFIX: z.string().default('/api/v1'),
  API_KEY: z.string().min(1),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET ต้องยาวอย่างน้อย 32 ตัวอักษร'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_EXPIRES_IN_DAYS: z.coerce.number().default(7),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', z.treeifyError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;
