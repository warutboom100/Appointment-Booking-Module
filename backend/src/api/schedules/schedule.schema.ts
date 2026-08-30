import { z } from 'zod';
import { isBreakInsideWorkingHours, timeToMinutes } from './schedule.fn';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const createScheduleSchema = z
  .object({
    day_of_week: z.coerce
      .number()
      .int('วันในสัปดาห์ต้องเป็นจำนวนเต็ม')
      .min(0, 'วันในสัปดาห์ต้องอยู่ระหว่าง 0 (อาทิตย์) ถึง 6 (เสาร์)')
      .max(6, 'วันในสัปดาห์ต้องอยู่ระหว่าง 0 (อาทิตย์) ถึง 6 (เสาร์)'),
    start_time: z.string().regex(timeRegex, 'รูปแบบเวลาเริ่มต้องเป็น HH:MM เช่น 09:00'),
    end_time: z.string().regex(timeRegex, 'รูปแบบเวลาสิ้นสุดต้องเป็น HH:MM เช่น 12:00'),
    break_start: z
      .string()
      .regex(timeRegex, 'รูปแบบเวลาเริ่มพักต้องเป็น HH:MM เช่น 12:00')
      .optional()
      .nullable()
      .or(z.literal('')),
    break_end: z
      .string()
      .regex(timeRegex, 'รูปแบบเวลาสิ้นสุดพักต้องเป็น HH:MM เช่น 13:00')
      .optional()
      .nullable()
      .or(z.literal('')),
    is_available: z.boolean().default(true),
    max_appointments: z.coerce
      .number()
      .int('จำนวนนัดหมายสูงสุดต้องเป็นจำนวนเต็ม')
      .min(1, 'จำนวนนัดหมายสูงสุดต้องมากกว่า 0')
      .optional()
      .nullable(),
  })
  .refine(
    (data) => timeToMinutes(data.end_time) > timeToMinutes(data.start_time),
    {
      message: 'เวลาสิ้นสุด (end_time) ต้องมากกว่าเวลาเริ่มต้น (start_time)',
      path: ['end_time'],
    },
  )
  .refine(
    (data) => {
      const bStart = data.break_start || null;
      const bEnd = data.break_end || null;
      if (!bStart && !bEnd) return true;
      return isBreakInsideWorkingHours(data.start_time, data.end_time, bStart, bEnd);
    },
    {
      message: 'เวลาพัก (break time) ต้องอยู่ภายในช่วงเวลาทำงานและเวลาสิ้นสุดพักต้องมากกว่าเวลาเริ่มพัก',
      path: ['break_end'],
    },
  );

export const updateScheduleSchema = z
  .object({
    day_of_week: z.coerce
      .number()
      .int()
      .min(0)
      .max(6)
      .optional(),
    start_time: z.string().regex(timeRegex, 'รูปแบบเวลาเริ่มต้องเป็น HH:MM').optional(),
    end_time: z.string().regex(timeRegex, 'รูปแบบเวลาสิ้นสุดต้องเป็น HH:MM').optional(),
    break_start: z
      .string()
      .regex(timeRegex, 'รูปแบบเวลาเริ่มพักต้องเป็น HH:MM')
      .optional()
      .nullable()
      .or(z.literal('')),
    break_end: z
      .string()
      .regex(timeRegex, 'รูปแบบเวลาสิ้นสุดพักต้องเป็น HH:MM')
      .optional()
      .nullable()
      .or(z.literal('')),
    is_available: z.boolean().optional(),
    max_appointments: z.coerce.number().int().min(1).optional().nullable(),
  });

export const doctorIdParamSchema = z.object({
  doctorId: z.string().uuid('รูปแบบ Doctor ID ไม่ถูกต้อง'),
});

export const scheduleIdParamSchema = z.object({
  id: z.string().uuid('รูปแบบ Schedule ID ไม่ถูกต้อง'),
});

export const scheduleQuerySchema = z.object({
  day_of_week: z.coerce.number().int().min(0).max(6).optional(),
  is_available: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
});

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;
export type ScheduleQuery = z.infer<typeof scheduleQuerySchema>;
export type DoctorIdParam = z.infer<typeof doctorIdParamSchema>;
export type ScheduleIdParam = z.infer<typeof scheduleIdParamSchema>;
