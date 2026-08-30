import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const timeField = z
  .string()
  .regex(timeRegex, 'รูปแบบเวลาต้องเป็น HH:MM เช่น 09:00')
  .transform((val) => val.slice(0, 5));

export const APPOINTMENT_STATUSES = [
  'booked',
  'confirmed',
  'checked_in',
  'in_progress',
  'completed',
  'cancelled',
  'no_show',
  'rescheduled',
] as const;

export const appointmentStatusSchema = z.enum(APPOINTMENT_STATUSES);

export const createAppointmentSchema = z.object({
  patient_id: z.string().uuid('รูปแบบ Patient ID ไม่ถูกต้อง'),
  doctor_id: z.string().uuid('รูปแบบ Doctor ID ไม่ถูกต้อง'),
  appointment_type_id: z.string().uuid('รูปแบบ Appointment Type ID ไม่ถูกต้อง'),
  appointment_date: z.string().regex(dateRegex, 'รูปแบบวันที่ต้องเป็น YYYY-MM-DD'),
  start_time: timeField,
  reason_for_visit: z.string().trim().max(1000, 'อาการเบื้องต้นต้องไม่เกิน 1000 ตัวอักษร').optional().nullable(),
  notes: z.string().trim().max(1000, 'หมายเหตุต้องไม่เกิน 1000 ตัวอักษร').optional().nullable(),
});

export const availableSlotsQuerySchema = z.object({
  doctor_id: z.string().uuid('รูปแบบ Doctor ID ไม่ถูกต้อง'),
  date: z.string().regex(dateRegex, 'รูปแบบวันที่ต้องเป็น YYYY-MM-DD'),
  appointment_type_id: z.string().uuid('รูปแบบ Appointment Type ID ไม่ถูกต้อง'),
});

export const updateAppointmentStatusSchema = z.object({
  status: appointmentStatusSchema,
});

export const cancelAppointmentSchema = z.object({
  cancellation_reason: z
    .string()
    .trim()
    .min(1, 'กรุณาระบุเหตุผลการยกเลิกนัดหมาย')
    .max(500, 'เหตุผลการยกเลิกต้องไม่เกิน 500 ตัวอักษร'),
});

export const rescheduleAppointmentSchema = z.object({
  appointment_date: z.string().regex(dateRegex, 'รูปแบบวันที่ต้องเป็น YYYY-MM-DD'),
  start_time: timeField,
  reason_for_visit: z.string().trim().max(1000, 'อาการเบื้องต้นต้องไม่เกิน 1000 ตัวอักษร').optional().nullable(),
  notes: z.string().trim().max(1000, 'หมายเหตุต้องไม่เกิน 1000 ตัวอักษร').optional().nullable(),
});

export const appointmentIdParamSchema = z.object({
  id: z.string().uuid('รูปแบบ Appointment ID ไม่ถูกต้อง'),
});

export const appointmentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  doctor_id: z.string().uuid().optional(),
  patient_id: z.string().uuid().optional(),
  department_id: z.string().uuid().optional(),
  date: z.string().regex(dateRegex).optional(),
  from_date: z.string().regex(dateRegex).optional(),
  to_date: z.string().regex(dateRegex).optional(),
  status: appointmentStatusSchema.optional(),
  search: z.string().trim().optional(),
});

export type AppointmentStatus = z.infer<typeof appointmentStatusSchema>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type AvailableSlotsQuery = z.infer<typeof availableSlotsQuerySchema>;
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;
export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentSchema>;
export type AppointmentIdParam = z.infer<typeof appointmentIdParamSchema>;
export type AppointmentQuery = z.infer<typeof appointmentQuerySchema>;
