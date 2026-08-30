import { db } from '../../knex/db';
import { errors } from '../../config/response';
import { now } from '../../utils/time';
import {
  isBreakInsideWorkingHours,
  isTimeOverlapping,
  timeToMinutes,
} from './schedule.fn';
import type {
  CreateScheduleInput,
  ScheduleQuery,
  UpdateScheduleInput,
} from './schedule.schema';

export interface DoctorSchedule {
  id: string;
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  break_start: string | null;
  break_end: string | null;
  is_available: boolean;
  max_appointments: number | null;
  created_at: Date;
  updated_at: Date;
}

export async function findByDoctor(
  doctorId: string,
  query: ScheduleQuery,
): Promise<DoctorSchedule[]> {
  const doctor = await db('doctors').where({ id: doctorId }).first();
  if (!doctor) {
    throw errors.notFound('ไม่พบข้อมูลแพทย์');
  }

  const baseQuery = db<DoctorSchedule>('doctor_schedules').where({ doctor_id: doctorId });

  if (typeof query.day_of_week === 'number') {
    baseQuery.where({ day_of_week: query.day_of_week });
  }

  if (typeof query.is_available === 'boolean') {
    baseQuery.where({ is_available: query.is_available });
  }

  return await baseQuery
    .orderBy('day_of_week', 'asc')
    .orderBy('start_time', 'asc');
}

export async function findById(id: string): Promise<DoctorSchedule> {
  const schedule = await db<DoctorSchedule>('doctor_schedules').where({ id }).first();
  if (!schedule) {
    throw errors.notFound('ไม่พบข้อมูลตารางเวลาของแพทย์');
  }
  return schedule;
}

export async function create(
  doctorId: string,
  input: CreateScheduleInput,
): Promise<DoctorSchedule> {
  // 1. Verify doctor exists and is active
  const doctor = await db('doctors').where({ id: doctorId }).first();
  if (!doctor) {
    throw errors.notFound('ไม่พบข้อมูลแพทย์');
  }
  if (!doctor.is_active) {
    throw errors.validation('แพทย์ท่านนี้ถูกปิดการใช้งานแล้ว');
  }

  // 2. Check for time overlap on the same day_of_week
  const existingSchedules = await db<DoctorSchedule>('doctor_schedules').where({
    doctor_id: doctorId,
    day_of_week: input.day_of_week,
  });

  for (const existing of existingSchedules) {
    if (
      isTimeOverlapping(
        input.start_time,
        input.end_time,
        existing.start_time,
        existing.end_time,
      )
    ) {
      throw errors.conflict(
        `ช่วงเวลาออกตรวจ ${input.start_time} - ${input.end_time} ทับซ้อนกับตารางเวลาเดิม (${existing.start_time.slice(0, 5)} - ${existing.end_time.slice(0, 5)}) ของแพทย์ในวันเดียวกัน`,
      );
    }
  }

  const timestamp = now();
  const [created] = await db<DoctorSchedule>('doctor_schedules')
    .insert({
      doctor_id: doctorId,
      day_of_week: input.day_of_week,
      start_time: input.start_time,
      end_time: input.end_time,
      break_start: input.break_start || null,
      break_end: input.break_end || null,
      is_available: input.is_available ?? true,
      max_appointments: input.max_appointments ?? null,
      created_at: timestamp,
      updated_at: timestamp,
    })
    .returning('*');

  return created;
}

export async function update(
  id: string,
  input: UpdateScheduleInput,
): Promise<DoctorSchedule> {
  const current = await findById(id);

  const effectiveDayOfWeek =
    input.day_of_week !== undefined ? input.day_of_week : current.day_of_week;
  const effectiveStartTime =
    input.start_time !== undefined ? input.start_time : current.start_time.slice(0, 5);
  const effectiveEndTime =
    input.end_time !== undefined ? input.end_time : current.end_time.slice(0, 5);
  const effectiveBreakStart =
    input.break_start !== undefined
      ? input.break_start || null
      : current.break_start
        ? current.break_start.slice(0, 5)
        : null;
  const effectiveBreakEnd =
    input.break_end !== undefined
      ? input.break_end || null
      : current.break_end
        ? current.break_end.slice(0, 5)
        : null;

  // 1. Validate start/end time logic
  if (timeToMinutes(effectiveEndTime) <= timeToMinutes(effectiveStartTime)) {
    throw errors.validation('เวลาสิ้นสุด (end_time) ต้องมากกว่าเวลาเริ่มต้น (start_time)');
  }

  // 2. Validate break time logic
  if (
    !isBreakInsideWorkingHours(
      effectiveStartTime,
      effectiveEndTime,
      effectiveBreakStart,
      effectiveBreakEnd,
    )
  ) {
    throw errors.validation(
      'เวลาพัก (break time) ต้องอยู่ภายในช่วงเวลาทำงานและเวลาสิ้นสุดพักต้องมากกว่าเวลาเริ่มพัก',
    );
  }

  // 3. Check overlap against other schedules of same doctor & same day_of_week
  const otherSchedules = await db<DoctorSchedule>('doctor_schedules')
    .where({
      doctor_id: current.doctor_id,
      day_of_week: effectiveDayOfWeek,
    })
    .whereNot({ id });

  for (const other of otherSchedules) {
    if (
      isTimeOverlapping(
        effectiveStartTime,
        effectiveEndTime,
        other.start_time,
        other.end_time,
      )
    ) {
      throw errors.conflict(
        `ช่วงเวลาออกตรวจ ${effectiveStartTime} - ${effectiveEndTime} ทับซ้อนกับตารางเวลาอื่น (${other.start_time.slice(0, 5)} - ${other.end_time.slice(0, 5)}) ของแพทย์ในวันเดียวกัน`,
      );
    }
  }

  const timestamp = now();
  const [updated] = await db<DoctorSchedule>('doctor_schedules')
    .where({ id })
    .update({
      ...(input.day_of_week !== undefined ? { day_of_week: input.day_of_week } : {}),
      ...(input.start_time !== undefined ? { start_time: input.start_time } : {}),
      ...(input.end_time !== undefined ? { end_time: input.end_time } : {}),
      ...(input.break_start !== undefined ? { break_start: input.break_start || null } : {}),
      ...(input.break_end !== undefined ? { break_end: input.break_end || null } : {}),
      ...(input.is_available !== undefined ? { is_available: input.is_available } : {}),
      ...(input.max_appointments !== undefined
        ? { max_appointments: input.max_appointments }
        : {}),
      updated_at: timestamp,
    })
    .returning('*');

  return updated;
}

export async function remove(id: string): Promise<DoctorSchedule> {
  const schedule = await findById(id);
  await db('doctor_schedules').where({ id }).del();
  return schedule;
}
