import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z.string().trim().min(1, 'กรุณาระบุชื่อแผนก').max(100, 'ชื่อแผนกต้องไม่เกิน 100 ตัวอักษร'),
  description: z.string().trim().max(1000, 'คำอธิบายต้องไม่เกิน 1000 ตัวอักษร').optional().nullable(),
  location: z.string().trim().max(200, 'สถานที่ต้องไม่เกิน 200 ตัวอักษร').optional().nullable(),
});

export const updateDepartmentSchema = z.object({
  name: z.string().trim().min(1, 'ชื่อแผนกต้องไม่เป็นค่าว่าง').max(100, 'ชื่อแผนกต้องไม่เกิน 100 ตัวอักษร').optional(),
  description: z.string().trim().max(1000, 'คำอธิบายต้องไม่เกิน 1000 ตัวอักษร').optional().nullable(),
  location: z.string().trim().max(200, 'สถานที่ต้องไม่เกิน 200 ตัวอักษร').optional().nullable(),
  is_active: z.boolean().optional(),
});

export const departmentIdParamSchema = z.object({
  id: z.string().uuid('รูปแบบ Department ID ไม่ถูกต้อง'),
});

export const departmentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  is_active: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
export type DepartmentQuery = z.infer<typeof departmentQuerySchema>;
export type DepartmentIdParam = z.infer<typeof departmentIdParamSchema>;
