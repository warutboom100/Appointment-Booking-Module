import { z } from 'zod';

export const createAppointmentTypeSchema = z.object({
  name: z.string().trim().min(1, 'กรุณาระบุชื่อประเภทการนัดหมาย').max(100, 'ชื่อต้องไม่เกิน 100 ตัวอักษร'),
  duration_minutes: z.coerce
    .number()
    .int('ระยะเวลาต้องเป็นจำนวนเต็ม')
    .min(1, 'ระยะเวลาต้องมากกว่า 0 นาที')
    .max(480, 'ระยะเวลาต้องไม่เกิน 480 นาที (8 ชั่วโมง)'),
  description: z.string().trim().max(1000, 'คำอธิบายต้องไม่เกิน 1000 ตัวอักษร').optional().nullable(),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'รหัสสีต้องเป็น Hex Code เช่น #4CAF50')
    .optional()
    .nullable()
    .or(z.literal('')),
});

export const updateAppointmentTypeSchema = z.object({
  name: z.string().trim().min(1, 'ชื่อต้องไม่เป็นค่าว่าง').max(100, 'ชื่อต้องไม่เกิน 100 ตัวอักษร').optional(),
  duration_minutes: z.coerce
    .number()
    .int('ระยะเวลาต้องเป็นจำนวนเต็ม')
    .min(1, 'ระยะเวลาต้องมากกว่า 0 นาที')
    .max(480, 'ระยะเวลาต้องไม่เกิน 480 นาที (8 ชั่วโมง)')
    .optional(),
  description: z.string().trim().max(1000, 'คำอธิบายต้องไม่เกิน 1000 ตัวอักษร').optional().nullable(),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'รหัสสีต้องเป็น Hex Code เช่น #4CAF50')
    .optional()
    .nullable()
    .or(z.literal('')),
  is_active: z.boolean().optional(),
});

export const appointmentTypeIdParamSchema = z.object({
  id: z.string().uuid('รูปแบบ Appointment Type ID ไม่ถูกต้อง'),
});

export const appointmentTypeQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  is_active: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
});

export type CreateAppointmentTypeInput = z.infer<typeof createAppointmentTypeSchema>;
export type UpdateAppointmentTypeInput = z.infer<typeof updateAppointmentTypeSchema>;
export type AppointmentTypeQuery = z.infer<typeof appointmentTypeQuerySchema>;
export type AppointmentTypeIdParam = z.infer<typeof appointmentTypeIdParamSchema>;
