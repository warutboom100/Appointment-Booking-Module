import { z } from 'zod';

export const createDoctorSchema = z.object({
  first_name: z.string().trim().min(1, 'กรุณาระบุชื่อ').max(100, 'ชื่อต้องไม่เกิน 100 ตัวอักษร'),
  last_name: z.string().trim().min(1, 'กรุณาระบุนามสกุล').max(100, 'นามสกุลต้องไม่เกิน 100 ตัวอักษร'),
  department_id: z.string().uuid('รูปแบบ Department ID ไม่ถูกต้อง'),
  license_no: z.string().trim().min(1, 'กรุณาระบุเลขที่ใบประกอบวิชาชีพ').max(50, 'เลขที่ใบประกอบวิชาชีพต้องไม่เกิน 50 ตัวอักษร'),
  specialization: z.string().trim().max(200, 'ความเชี่ยวชาญต้องไม่เกิน 200 ตัวอักษร').optional().nullable(),
  phone: z.string().trim().max(20, 'เบอร์โทรศัพท์ต้องไม่เกิน 20 ตัวอักษร').optional().nullable(),
  email: z
    .string()
    .trim()
    .email('รูปแบบอีเมลไม่ถูกต้อง')
    .max(100, 'อีเมลต้องไม่เกิน 100 ตัวอักษร')
    .optional()
    .nullable()
    .or(z.literal('')),
  user_id: z.string().uuid('รูปแบบ User ID ไม่ถูกต้อง').optional().nullable(),
});

export const updateDoctorSchema = z.object({
  first_name: z.string().trim().min(1, 'ชื่อต้องไม่เป็นค่าว่าง').max(100, 'ชื่อต้องไม่เกิน 100 ตัวอักษร').optional(),
  last_name: z.string().trim().min(1, 'นามสกุลต้องไม่เป็นค่าว่าง').max(100, 'นามสกุลต้องไม่เกิน 100 ตัวอักษร').optional(),
  department_id: z.string().uuid('รูปแบบ Department ID ไม่ถูกต้อง').optional(),
  license_no: z.string().trim().min(1, 'เลขที่ใบประกอบวิชาชีพต้องไม่เป็นค่าว่าง').max(50, 'เลขที่ใบประกอบวิชาชีพต้องไม่เกิน 50 ตัวอักษร').optional(),
  specialization: z.string().trim().max(200, 'ความเชี่ยวชาญต้องไม่เกิน 200 ตัวอักษร').optional().nullable(),
  phone: z.string().trim().max(20, 'เบอร์โทรศัพท์ต้องไม่เกิน 20 ตัวอักษร').optional().nullable(),
  email: z
    .string()
    .trim()
    .email('รูปแบบอีเมลไม่ถูกต้อง')
    .max(100, 'อีเมลต้องไม่เกิน 100 ตัวอักษร')
    .optional()
    .nullable()
    .or(z.literal('')),
  user_id: z.string().uuid('รูปแบบ User ID ไม่ถูกต้อง').optional().nullable(),
  is_active: z.boolean().optional(),
});

export const doctorIdParamSchema = z.object({
  id: z.string().uuid('รูปแบบ Doctor ID ไม่ถูกต้อง'),
});

export const doctorQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  department_id: z.string().uuid('รูปแบบ Department ID ไม่ถูกต้อง').optional(),
  search: z.string().trim().optional(),
  is_active: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
});

export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>;
export type DoctorQuery = z.infer<typeof doctorQuerySchema>;
export type DoctorIdParam = z.infer<typeof doctorIdParamSchema>;
