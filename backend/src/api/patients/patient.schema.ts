import { z } from 'zod';

export const genderSchema = z.enum(['male', 'female', 'other']);

export const createPatientSchema = z.object({
  first_name: z
    .string({ required_error: 'กรุณาระบุชื่อ' })
    .trim()
    .min(1, 'กรุณาระบุชื่อ')
    .max(100, 'ชื่อต้องไม่เกิน 100 ตัวอักษร'),
  last_name: z
    .string({ required_error: 'กรุณาระบุนามสกุล' })
    .trim()
    .min(1, 'กรุณาระบุนามสกุล')
    .max(100, 'นามสกุลต้องไม่เกิน 100 ตัวอักษร'),
  date_of_birth: z
    .string({ required_error: 'กรุณาระบุวันเกิด' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'รูปแบบวันเกิดต้องเป็น YYYY-MM-DD')
    .refine((val) => !isNaN(Date.parse(val)), 'วันเกิดไม่ถูกต้อง'),
  gender: genderSchema,
  phone: z
    .string({ required_error: 'กรุณาระบุเบอร์โทรศัพท์' })
    .trim()
    .min(1, 'กรุณาระบุเบอร์โทรศัพท์')
    .max(20, 'เบอร์โทรศัพท์ต้องไม่เกิน 20 ตัวอักษร'),
  email: z
    .string()
    .trim()
    .email('รูปแบบอีเมลไม่ถูกต้อง')
    .max(100, 'อีเมลต้องไม่เกิน 100 ตัวอักษร')
    .optional()
    .nullable()
    .or(z.literal('')),
  id_card_no: z.string().trim().max(20, 'เลขบัตรประชาชน/พาสปอร์ตต้องไม่เกิน 20 ตัวอักษร').optional().nullable(),
  address: z.string().trim().max(1000, 'ที่อยู่ต้องไม่เกิน 1000 ตัวอักษร').optional().nullable(),
  blood_type: z
    .string()
    .trim()
    .max(5, 'หมู่เลือดต้องไม่เกิน 5 ตัวอักษร')
    .optional()
    .nullable(),
  allergies: z.string().trim().max(2000, 'ประวัติการแพ้ยา/อาหารต้องไม่เกิน 2000 ตัวอักษร').optional().nullable(),
});

export const updatePatientSchema = z.object({
  first_name: z.string().trim().min(1, 'ชื่อต้องไม่เป็นค่าว่าง').max(100, 'ชื่อต้องไม่เกิน 100 ตัวอักษร').optional(),
  last_name: z.string().trim().min(1, 'นามสกุลต้องไม่เป็นค่าว่าง').max(100, 'นามสกุลต้องไม่เกิน 100 ตัวอักษร').optional(),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'รูปแบบวันเกิดต้องเป็น YYYY-MM-DD')
    .refine((val) => !isNaN(Date.parse(val)), 'วันเกิดไม่ถูกต้อง')
    .optional(),
  gender: genderSchema.optional(),
  phone: z.string().trim().min(1, 'เบอร์โทรศัพท์ต้องไม่เป็นค่าว่าง').max(20, 'เบอร์โทรศัพท์ต้องไม่เกิน 20 ตัวอักษร').optional(),
  email: z
    .string()
    .trim()
    .email('รูปแบบอีเมลไม่ถูกต้อง')
    .max(100, 'อีเมลต้องไม่เกิน 100 ตัวอักษร')
    .optional()
    .nullable()
    .or(z.literal('')),
  id_card_no: z.string().trim().max(20, 'เลขบัตรประชาชน/พาสปอร์ตต้องไม่เกิน 20 ตัวอักษร').optional().nullable(),
  address: z.string().trim().max(1000, 'ที่อยู่ต้องไม่เกิน 1000 ตัวอักษร').optional().nullable(),
  blood_type: z.string().trim().max(5, 'หมู่เลือดต้องไม่เกิน 5 ตัวอักษร').optional().nullable(),
  allergies: z.string().trim().max(2000, 'ประวัติการแพ้ยา/อาหารต้องไม่เกิน 2000 ตัวอักษร').optional().nullable(),
  is_active: z.boolean().optional(),
});

export const patientIdParamSchema = z.object({
  id: z.string().uuid('รูปแบบ Patient ID ไม่ถูกต้อง'),
});

export const patientQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  gender: genderSchema.optional(),
  is_active: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
});

export type Gender = z.infer<typeof genderSchema>;
export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
export type PatientQuery = z.infer<typeof patientQuerySchema>;
export type PatientIdParam = z.infer<typeof patientIdParamSchema>;
