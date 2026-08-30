import { z } from 'zod';

export const registerSchema = z.object({
  username: z.string().trim().min(3).max(50),
  password: z.string().min(6).max(100),
  name: z.string().trim().min(1).max(100),
  role: z.enum(['admin', 'doctor', 'receptionist']).default('receptionist'),
});

export const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
