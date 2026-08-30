import { db } from '../../knex/db';
import { errors } from '../../config/response';
import { now } from '../../utils/time';
import { isBreakInsideWorkingHours, timeToMinutes } from '../schedules/schedule.fn';
import type {
  CreateOverrideInput,
  OverrideQuery,
  UpdateOverrideInput,
} from './override.schema';

export interface ScheduleOverride {
  id: string;
  doctor_id: string;
  override_date: string;
  is_available: boolean;
  start_time: string | null;
  end_time: string | null;
  break_start: string | null;
  break_end: string | null;
  reason: string | null;
  created_at: Date;
  updated_at: Date;

  // Joined doctor & department fields
  doctor_first_name?: string;
  doctor_last_name?: string;
  department_id?: string;
  department_name?: string;
}

export async function findAll(query: OverrideQuery): Promise<ScheduleOverride[]> {
  const baseQuery = db('schedule_overrides as so')
    .leftJoin('doctors as d', 'so.doctor_id', 'd.id')
    .leftJoin('departments as dep', 'd.department_id', 'dep.id');

  if (query.doctor_id) {
    baseQuery.where('so.doctor_id', query.doctor_id);
  }

  if (query.department_id) {
    baseQuery.where('d.department_id', query.department_id);
  }

  if (query.from_date) {
    baseQuery.where('so.override_date', '>=', query.from_date);
  }

  if (query.to_date) {
    baseQuery.where('so.override_date', '<=', query.to_date);
  }

  if (typeof query.is_available === 'boolean') {
    baseQuery.where('so.is_available', query.is_available);
  }

  const rows = await baseQuery
    .select(
      'so.*',
      'd.first_name as doctor_first_name',
      'd.last_name as doctor_last_name',
      'd.department_id as department_id',
      'dep.name as department_name',
    )
    .orderBy('so.override_date', 'desc')
    .orderBy('so.start_time', 'asc');

  return rows;
}

export async function findByDoctor(
  doctorId: string,
  query: OverrideQuery,
): Promise<ScheduleOverride[]> {
  const doctor = await db('doctors').where({ id: doctorId }).first();
  if (!doctor) {
    throw errors.notFound('ไม่พบข้อมูลแพทย์');
  }

  const baseQuery = db<ScheduleOverride>('schedule_overrides').where({ doctor_id: doctorId });

  if (query.from_date) {
    baseQuery.where('override_date', '>=', query.from_date);
  }

  if (query.to_date) {
    baseQuery.where('override_date', '<=', query.to_date);
  }

  if (typeof query.is_available === 'boolean') {
    baseQuery.where({ is_available: query.is_available });
  }

  return await baseQuery.orderBy('override_date', 'asc');
}

export async function findById(id: string): Promise<ScheduleOverride> {
  const override = await db<ScheduleOverride>('schedule_overrides').where({ id }).first();
  if (!override) {
    throw errors.notFound('ไม่พบข้อมูลข้อยกเว้นตารางเวลา');
  }
  return override;
}

export async function create(
  doctorId: string,
  input: CreateOverrideInput,
): Promise<ScheduleOverride> {
  const doctor = await db('doctors').where({ id: doctorId }).first();
  if (!doctor) {
    throw errors.notFound('ไม่พบข้อมูลแพทย์');
  }
  if (!doctor.is_active) {
    throw errors.validation('แพทย์ท่านนี้ถูกปิดการใช้งานแล้ว');
  }

  const existing = await db('schedule_overrides')
    .where({ doctor_id: doctorId, override_date: input.override_date })
    .first();

  if (existing) {
    throw errors.duplicate('มีข้อยกเว้นตารางเวลาสำหรับแพทย์ในวันนี้อยู่แล้ว');
  }

  const timestamp = now();
  const [created] = await db<ScheduleOverride>('schedule_overrides')
    .insert({
      doctor_id: doctorId,
      override_date: input.override_date,
      is_available: input.is_available,
      start_time: input.is_available ? input.start_time || null : null,
      end_time: input.is_available ? input.end_time || null : null,
      break_start: input.is_available ? input.break_start || null : null,
      break_end: input.is_available ? input.break_end || null : null,
      reason: input.reason || null,
      created_at: timestamp,
      updated_at: timestamp,
    })
    .returning('*');

  return created;
}

export async function update(
  id: string,
  input: UpdateOverrideInput,
): Promise<ScheduleOverride> {
  const current = await findById(id);

  const effectiveDate = input.override_date ?? current.override_date;
  const effectiveIsAvailable =
    input.is_available !== undefined ? input.is_available : current.is_available;
  const effectiveStartTime =
    input.start_time !== undefined
      ? input.start_time || null
      : current.start_time
        ? current.start_time.slice(0, 5)
        : null;
  const effectiveEndTime =
    input.end_time !== undefined
      ? input.end_time || null
      : current.end_time
        ? current.end_time.slice(0, 5)
        : null;
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

  if (effectiveDate !== current.override_date) {
    const duplicate = await db('schedule_overrides')
      .where({ doctor_id: current.doctor_id, override_date: effectiveDate })
      .whereNot({ id })
      .first();

    if (duplicate) {
      throw errors.duplicate('มีข้อยกเว้นตารางเวลาสำหรับแพทย์ในวันนี้อยู่แล้ว');
    }
  }

  if (effectiveIsAvailable) {
    if (!effectiveStartTime || !effectiveEndTime) {
      throw errors.validation('กรณีเปิดออกตรวจพิเศษ (is_available = true) ต้องระบุเวลาเริ่มและสิ้นสุด');
    }
    if (timeToMinutes(effectiveEndTime) <= timeToMinutes(effectiveStartTime)) {
      throw errors.validation('เวลาสิ้นสุด (end_time) ต้องมากกว่าเวลาเริ่มต้น (start_time)');
    }
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
  }

  const timestamp = now();
  const [updated] = await db<ScheduleOverride>('schedule_overrides')
    .where({ id })
    .update({
      ...(input.override_date !== undefined ? { override_date: input.override_date } : {}),
      ...(input.is_available !== undefined ? { is_available: input.is_available } : {}),
      start_time: effectiveIsAvailable ? effectiveStartTime : null,
      end_time: effectiveIsAvailable ? effectiveEndTime : null,
      break_start: effectiveIsAvailable ? effectiveBreakStart : null,
      break_end: effectiveIsAvailable ? effectiveBreakEnd : null,
      ...(input.reason !== undefined ? { reason: input.reason || null } : {}),
      updated_at: timestamp,
    })
    .returning('*');

  return updated;
}

export async function remove(id: string): Promise<ScheduleOverride> {
  const override = await findById(id);
  await db('schedule_overrides').where({ id }).del();
  return override;
}
