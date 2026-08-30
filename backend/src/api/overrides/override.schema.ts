import { z } from 'zod';
import { isBreakInsideWorkingHours, timeToMinutes } from '../schedules/schedule.fn';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const optionalTimeField = z
  .string()
  .regex(timeRegex, 'รูปแบบเวลาต้องเป็น HH:MM เช่น 12:00')
  .transform((val) => val.slice(0, 5))
  .optional()
  .nullable()
  .or(z.literal(''));

export const createOverrideSchema = z
  .object({
    override_date: z.string().regex(dateRegex, 'รูปแบบวันที่ต้องเป็น YYYY-MM-DD'),
    is_available: z.boolean(),
    start_time: optionalTimeField,
    end_time: optionalTimeField,
    break_start: optionalTimeField,
    break_end: optionalTimeField,
    reason: z.string().trim().max(200, 'เหตุผลต้องไม่เกิน 200 ตัวอักษร').optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.is_available) {
        return !!data.start_time && !!data.end_time;
      }
      return true;
    },
    {
      message: 'กรณีเปิดออกตรวจพิเศษ (is_available = true) ต้องระบุเวลาเริ่มและสิ้นสุด',
      path: ['start_time'],
    },
  )
  .refine(
    (data) => {
      if (data.is_available && data.start_time && data.end_time) {
        return timeToMinutes(data.end_time) > timeToMinutes(data.start_time);
      }
      return true;
    },
    {
      message: 'เวลาสิ้นสุด (end_time) ต้องมากกว่าเวลาเริ่มต้น (start_time)',
      path: ['end_time'],
    },
  )
  .refine(
    (data) => {
      if (data.is_available && data.start_time && data.end_time) {
        const bStart = data.break_start || null;
        const bEnd = data.break_end || null;
        if (!bStart && !bEnd) return true;
        return isBreakInsideWorkingHours(data.start_time, data.end_time, bStart, bEnd);
      }
      return true;
    },
    {
      message: 'เวลาพัก (break time) ต้องอยู่ภายในช่วงเวลาทำงานและเวลาสิ้นสุดพักต้องมากกว่าเวลาเริ่มพัก',
      path: ['break_end'],
    },
  );

export const updateOverrideSchema = z.object({
  override_date: z.string().regex(dateRegex, 'รูปแบบวันที่ต้องเป็น YYYY-MM-DD').optional(),
  is_available: z.boolean().optional(),
  start_time: optionalTimeField,
  end_time: optionalTimeField,
  break_start: optionalTimeField,
  break_end: optionalTimeField,
  reason: z.string().trim().max(200, 'เหตุผลต้องไม่เกิน 200 ตัวอักษร').optional().nullable(),
});

export const overrideIdParamSchema = z.object({
  id: z.string().uuid('รูปแบบ Override ID ไม่ถูกต้อง'),
});

export const doctorIdParamSchema = z.object({
  doctorId: z.string().uuid('รูปแบบ Doctor ID ไม่ถูกต้อง'),
});

export const overrideQuerySchema = z.object({
  from_date: z.string().regex(dateRegex, 'รูปแบบ from_date ต้องเป็น YYYY-MM-DD').optional(),
  to_date: z.string().regex(dateRegex, 'รูปแบบ to_date ต้องเป็น YYYY-MM-DD').optional(),
  is_available: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
});

export type CreateOverrideInput = z.infer<typeof createOverrideSchema>;
export type UpdateOverrideInput = z.infer<typeof updateOverrideSchema>;
export type OverrideQuery = z.infer<typeof overrideQuerySchema>;
export type DoctorIdParam = z.infer<typeof doctorIdParamSchema>;
export type OverrideIdParam = z.infer<typeof overrideIdParamSchema>;
