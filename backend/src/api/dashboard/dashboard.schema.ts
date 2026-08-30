import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const dashboardSummaryQuerySchema = z.object({
  date: z.string().regex(dateRegex, 'รูปแบบ date ต้องเป็น YYYY-MM-DD').optional(),
  department_id: z.string().uuid('รูปแบบ Department ID ไม่ถูกต้อง').optional(),
  doctor_id: z.string().uuid('รูปแบบ Doctor ID ไม่ถูกต้อง').optional(),
});

export const dashboardStatsQuerySchema = z.object({
  from_date: z.string().regex(dateRegex, 'รูปแบบ from_date ต้องเป็น YYYY-MM-DD').optional(),
  to_date: z.string().regex(dateRegex, 'รูปแบบ to_date ต้องเป็น YYYY-MM-DD').optional(),
  department_id: z.string().uuid('รูปแบบ Department ID ไม่ถูกต้อง').optional(),
  doctor_id: z.string().uuid('รูปแบบ Doctor ID ไม่ถูกต้อง').optional(),
});

export type DashboardSummaryQuery = z.infer<typeof dashboardSummaryQuerySchema>;
export type DashboardStatsQuery = z.infer<typeof dashboardStatsQuerySchema>;
