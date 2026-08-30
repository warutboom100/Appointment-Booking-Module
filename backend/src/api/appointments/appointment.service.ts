import type { Knex } from 'knex';
import { db } from '../../knex/db';
import { errors, type PageMeta } from '../../config/response';
import { now } from '../../utils/time';
import {
  addMinutesToTime,
  generateCandidateSlots,
  getDayOfWeekFromDate,
  isDateTimeInPastOrTooLate,
  isSlotOverlappingBookings,
  isSlotOverlappingBreak,
  MIN_ADVANCE_HOURS,
} from './appointment.fn';
import { timeToMinutes } from '../schedules/schedule.fn';
import type {
  AppointmentQuery,
  AppointmentStatus,
  AvailableSlotsQuery,
  CancelAppointmentInput,
  CreateAppointmentInput,
  RescheduleAppointmentInput,
} from './appointment.schema';

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  department_id: string;
  appointment_type_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  reason_for_visit: string | null;
  notes: string | null;
  created_by_user_id: string;
  cancelled_by_user_id: string | null;
  cancellation_reason: string | null;
  cancelled_at: Date | null;
  rescheduled_from_id: string | null;
  created_at: Date;
  updated_at: Date;

  // Joined relations
  patient_hn?: string;
  patient_name?: string;
  patient_phone?: string | null;
  doctor_name?: string;
  department_name?: string;
  appointment_type_name?: string;
  appointment_type_color?: string | null;
  appointment_type_duration?: number;
}

export interface AvailableSlotsResult {
  doctor_id: string;
  doctor_name: string;
  date: string;
  appointment_type: string;
  duration_minutes: number;
  slots: Array<{ start_time: string; end_time: string }>;
}

// Valid Status Transitions
const VALID_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  booked: ['confirmed', 'cancelled', 'rescheduled'],
  confirmed: ['checked_in', 'cancelled', 'no_show', 'rescheduled'],
  checked_in: ['in_progress', 'no_show'],
  in_progress: ['completed'],
  completed: [],
  cancelled: [],
  no_show: [],
  rescheduled: [],
};

export async function getAvailableSlots(
  query: AvailableSlotsQuery,
  trx: Knex = db,
): Promise<AvailableSlotsResult> {
  const { doctor_id, date, appointment_type_id } = query;

  // 1. Verify doctor
  const doctor = await trx('doctors').where({ id: doctor_id }).first();
  if (!doctor) throw errors.notFound('ไม่พบข้อมูลแพทย์');
  if (!doctor.is_active) throw errors.validation('แพทย์ท่านนี้ถูกปิดการใช้งานแล้ว', 'DOCTOR_INACTIVE');

  // 2. Verify appointment type
  const apptType = await trx('appointment_types').where({ id: appointment_type_id }).first();
  if (!apptType) throw errors.notFound('ไม่พบประเภทการนัดหมาย');
  if (!apptType.is_active) throw errors.validation('ประเภทการนัดหมายนี้ถูกปิดการใช้งานแล้ว', 'TYPE_INACTIVE');

  const duration = apptType.duration_minutes;
  const resultHeader: AvailableSlotsResult = {
    doctor_id,
    doctor_name: `${doctor.first_name} ${doctor.last_name}`,
    date,
    appointment_type: apptType.name,
    duration_minutes: duration,
    slots: [],
  };

  // 3. Resolve Working Hours (Override vs Weekly Schedule)
  let workingBlocks: Array<{
    start_time: string;
    end_time: string;
    break_start?: string | null;
    break_end?: string | null;
    max_appointments?: number | null;
  }> = [];

  const override = await trx('schedule_overrides')
    .where({ doctor_id, override_date: date })
    .first();

  if (override) {
    if (!override.is_available) {
      return resultHeader; // Doctor is OFF
    }
    if (override.start_time && override.end_time) {
      workingBlocks.push({
        start_time: override.start_time.slice(0, 5),
        end_time: override.end_time.slice(0, 5),
        break_start: override.break_start ? override.break_start.slice(0, 5) : null,
        break_end: override.break_end ? override.break_end.slice(0, 5) : null,
      });
    }
  } else {
    const dayOfWeek = getDayOfWeekFromDate(date);
    const recurring = await trx('doctor_schedules')
      .where({ doctor_id, day_of_week: dayOfWeek, is_available: true })
      .orderBy('start_time', 'asc');

    for (const sched of recurring) {
      workingBlocks.push({
        start_time: sched.start_time.slice(0, 5),
        end_time: sched.end_time.slice(0, 5),
        break_start: sched.break_start ? sched.break_start.slice(0, 5) : null,
        break_end: sched.break_end ? sched.break_end.slice(0, 5) : null,
        max_appointments: sched.max_appointments,
      });
    }
  }

  if (workingBlocks.length === 0) {
    return resultHeader;
  }

  // 4. Fetch Active Bookings on that day
  const activeBookings = await trx('appointments')
    .where({ doctor_id, appointment_date: date })
    .whereNotIn('status', ['cancelled', 'rescheduled'])
    .select('start_time', 'end_time');

  const normalizedBookings = activeBookings.map((b) => ({
    start_time: b.start_time.slice(0, 5),
    end_time: b.end_time.slice(0, 5),
  }));

  // Check max_appointments cap if any block specifies it
  const maxLimit = workingBlocks.find((b) => b.max_appointments !== null && b.max_appointments !== undefined)
    ?.max_appointments;
  if (maxLimit && activeBookings.length >= maxLimit) {
    return resultHeader; // Daily cap reached
  }

  // 5. Generate and filter candidate slots
  const allAvailableSlots: Array<{ start_time: string; end_time: string }> = [];

  for (const block of workingBlocks) {
    const candidates = generateCandidateSlots(
      block.start_time,
      block.end_time,
      duration,
      block.break_start,
      block.break_end,
    );

    for (const slot of candidates) {
      // Must not overlap any booked appointment
      if (isSlotOverlappingBookings(slot.start_time, slot.end_time, normalizedBookings)) {
        continue;
      }

      // Check advance booking / past date
      const { inPastDate, tooLate } = isDateTimeInPastOrTooLate(date, slot.start_time, MIN_ADVANCE_HOURS);
      if (inPastDate || tooLate) {
        continue;
      }

      allAvailableSlots.push(slot);
    }
  }

  resultHeader.slots = allAvailableSlots;
  return resultHeader;
}

export async function create(
  userId: string,
  input: CreateAppointmentInput,
  externalTrx?: Knex,
): Promise<Appointment> {
  const executeBooking = async (trx: Knex): Promise<Appointment> => {
    const { patient_id, doctor_id, appointment_type_id, appointment_date, start_time } = input;

    // Rule 1: Date must not be in past
    // Rule 2: Must book >= 1 hour in advance
    const { inPastDate, tooLate } = isDateTimeInPastOrTooLate(appointment_date, start_time, MIN_ADVANCE_HOURS);
    if (inPastDate) {
      throw errors.validation('ไม่สามารถจองนัดหมายในอดีตได้', 'PAST_DATE');
    }
    if (tooLate) {
      throw errors.validation('ต้องจองนัดหมายล่วงหน้าอย่างน้อย 1 ชั่วโมง', 'TOO_LATE');
    }

    // Rule 8: Doctor must be active + Pessimistic Row Lock (SELECT ... FOR UPDATE)
    // Serializes concurrent booking requests for the same doctor to completely eliminate race conditions!
    const doctor = await trx('doctors').where({ id: doctor_id }).forUpdate().first();
    if (!doctor) throw errors.notFound('ไม่พบข้อมูลแพทย์');
    if (!doctor.is_active) throw errors.validation('แพทย์ท่านนี้ถูกปิดการใช้งานแล้ว', 'DOCTOR_INACTIVE');

    // Rule 9: Patient must be active
    const patient = await trx('patients').where({ id: patient_id }).first();
    if (!patient) throw errors.notFound('ไม่พบข้อมูลผู้ป่วย');
    if (!patient.is_active) throw errors.validation('ข้อมูลผู้ป่วยถูกปิดการใช้งาน', 'PATIENT_INACTIVE');

    // Rule 10: Appointment Type must be active
    const apptType = await trx('appointment_types').where({ id: appointment_type_id }).first();
    if (!apptType) throw errors.notFound('ไม่พบประเภทการนัดหมาย');
    if (!apptType.is_active) throw errors.validation('ประเภทการนัดหมายถูกปิดการใช้งาน', 'TYPE_INACTIVE');

    const duration = apptType.duration_minutes;
    const end_time = addMinutesToTime(start_time, duration);

    // Rule 3 & 4: Doctor Schedule & Availability
    const override = await trx('schedule_overrides')
      .where({ doctor_id, override_date: appointment_date })
      .first();

    let matchingBlock: {
      start_time: string;
      end_time: string;
      break_start?: string | null;
      break_end?: string | null;
      max_appointments?: number | null;
    } | null = null;

    if (override) {
      if (!override.is_available) {
        throw errors.validation('แพทย์ไม่มีตารางตรวจในวันที่ระบุ (แพทย์ลาหยุด)', 'SCHEDULE_UNAVAILABLE');
      }
      if (override.start_time && override.end_time) {
        matchingBlock = {
          start_time: override.start_time.slice(0, 5),
          end_time: override.end_time.slice(0, 5),
          break_start: override.break_start ? override.break_start.slice(0, 5) : null,
          break_end: override.break_end ? override.break_end.slice(0, 5) : null,
        };
      }
    } else {
      const dayOfWeek = getDayOfWeekFromDate(appointment_date);
      const recurring = await trx('doctor_schedules').where({
        doctor_id,
        day_of_week: dayOfWeek,
        is_available: true,
      });

      if (recurring.length === 0) {
        throw errors.validation('แพทย์ไม่มีตารางตรวจในวันที่ระบุ', 'NO_SCHEDULE');
      }

      // Find block that contains requested slot
      for (const sched of recurring) {
        const blockStart = sched.start_time.slice(0, 5);
        const blockEnd = sched.end_time.slice(0, 5);
        if (
          timeToMinutes(start_time) >= timeToMinutes(blockStart) &&
          timeToMinutes(end_time) <= timeToMinutes(blockEnd)
        ) {
          matchingBlock = {
            start_time: blockStart,
            end_time: blockEnd,
            break_start: sched.break_start ? sched.break_start.slice(0, 5) : null,
            break_end: sched.break_end ? sched.break_end.slice(0, 5) : null,
            max_appointments: sched.max_appointments,
          };
          break;
        }
      }
    }

    // Rule 5: Outside Working Hours
    if (!matchingBlock) {
      throw errors.validation('เวลาที่ระบุอยู่นอกเวลาออกตรวจของแพทย์', 'OUTSIDE_WORKING_HOURS');
    }

    if (
      timeToMinutes(start_time) < timeToMinutes(matchingBlock.start_time) ||
      timeToMinutes(end_time) > timeToMinutes(matchingBlock.end_time)
    ) {
      throw errors.validation('เวลาที่ระบุอยู่นอกเวลาออกตรวจของแพทย์', 'OUTSIDE_WORKING_HOURS');
    }

    // Rule 6: Break Time Overlap
    if (isSlotOverlappingBreak(start_time, end_time, matchingBlock.break_start, matchingBlock.break_end)) {
      throw errors.validation('เวลาที่ระบุตรงกับช่วงเวลาพักของแพทย์', 'DURING_BREAK');
    }

    // Fetch active bookings
    const activeBookings = await trx('appointments')
      .where({ doctor_id, appointment_date })
      .whereNotIn('status', ['cancelled', 'rescheduled'])
      .select('start_time', 'end_time');

    const normalizedBookings = activeBookings.map((b) => ({
      start_time: b.start_time.slice(0, 5),
      end_time: b.end_time.slice(0, 5),
    }));

    // Rule 7: Slot Overlap (409 Conflict)
    if (isSlotOverlappingBookings(start_time, end_time, normalizedBookings)) {
      throw errors.conflict('ช่วงเวลานี้มีนัดหมายอื่นอยู่แล้ว กรุณาเลือกเวลาอื่น', 'SLOT_TAKEN');
    }

    // Rule 11: Max Appointments Limit
    if (
      matchingBlock.max_appointments !== null &&
      matchingBlock.max_appointments !== undefined &&
      activeBookings.length >= matchingBlock.max_appointments
    ) {
      throw errors.conflict('จำนวนนัดหมายของแพทย์ในวันนี้เต็มแล้ว', 'MAX_APPOINTMENTS_REACHED');
    }

    const timestamp = now();
    const [created] = await trx('appointments')
      .insert({
        patient_id,
        doctor_id,
        department_id: doctor.department_id,
        appointment_type_id,
        appointment_date,
        start_time,
        end_time,
        status: 'booked',
        reason_for_visit: input.reason_for_visit || null,
        notes: input.notes || null,
        created_by_user_id: userId,
        created_at: timestamp,
        updated_at: timestamp,
      })
      .returning('*');

    return await findById(created.id, trx);
  };

  if (externalTrx) {
    return await executeBooking(externalTrx);
  }

  return await db.transaction(async (trx) => {
    return await executeBooking(trx);
  });
}

export async function findById(id: string, trx: Knex = db): Promise<Appointment> {
  const appointment = await trx('appointments as a')
    .leftJoin('patients as p', 'a.patient_id', 'p.id')
    .leftJoin('doctors as d', 'a.doctor_id', 'd.id')
    .leftJoin('departments as dep', 'a.department_id', 'dep.id')
    .leftJoin('appointment_types as at', 'a.appointment_type_id', 'at.id')
    .where('a.id', id)
    .select(
      'a.*',
      'p.hn as patient_hn',
      trx.raw("CONCAT(p.first_name, ' ', p.last_name) as patient_name"),
      'p.phone as patient_phone',
      trx.raw("CONCAT(d.first_name, ' ', d.last_name) as doctor_name"),
      'dep.name as department_name',
      'at.name as appointment_type_name',
      'at.color as appointment_type_color',
      'at.duration_minutes as appointment_type_duration',
    )
    .first();

  if (!appointment) {
    throw errors.notFound('ไม่พบข้อมูลการนัดหมาย');
  }

  return appointment;
}

export async function updateStatus(
  id: string,
  newStatus: AppointmentStatus,
  trx: Knex = db,
): Promise<Appointment> {
  const current = await findById(id, trx);

  const allowedTransitions = VALID_TRANSITIONS[current.status] || [];
  if (!allowedTransitions.includes(newStatus)) {
    throw errors.validation(
      `ไม่สามารถเปลี่ยนสถานะจาก '${current.status}' เป็น '${newStatus}' ได้`,
      'INVALID_STATUS_TRANSITION',
    );
  }

  const timestamp = now();
  await trx('appointments')
    .where({ id })
    .update({
      status: newStatus,
      updated_at: timestamp,
    });

  return await findById(id, trx);
}

export async function cancel(
  id: string,
  userId: string,
  input: CancelAppointmentInput,
  trx: Knex = db,
): Promise<Appointment> {
  const current = await findById(id, trx);

  if (current.status !== 'booked' && current.status !== 'confirmed') {
    throw errors.validation(
      `ไม่สามารถยกเลิกนัดหมายที่มีสถานะ '${current.status}' ได้`,
      'CANNOT_CANCEL',
    );
  }

  const timestamp = now();
  await trx('appointments')
    .where({ id })
    .update({
      status: 'cancelled',
      cancellation_reason: input.cancellation_reason,
      cancelled_by_user_id: userId,
      cancelled_at: timestamp,
      updated_at: timestamp,
    });

  return await findById(id, trx);
}

export async function reschedule(
  id: string,
  userId: string,
  input: RescheduleAppointmentInput,
): Promise<Appointment> {
  return await db.transaction(async (trx) => {
    const original = await findById(id, trx);

    if (original.status !== 'booked' && original.status !== 'confirmed') {
      throw errors.validation(
        `ไม่สามารถเลื่อนนัดหมายที่มีสถานะ '${original.status}' ได้`,
        'CANNOT_RESCHEDULE',
      );
    }

    // 1. Mark original appointment as rescheduled (frees old slot)
    const timestamp = now();
    await trx('appointments')
      .where({ id })
      .update({
        status: 'rescheduled',
        updated_at: timestamp,
      });

    // 2. Create new appointment with full 11-step validation inside same transaction
    const newAppointment = await create(
      userId,
      {
        patient_id: original.patient_id,
        doctor_id: original.doctor_id,
        appointment_type_id: original.appointment_type_id,
        appointment_date: input.appointment_date,
        start_time: input.start_time,
        reason_for_visit: input.reason_for_visit ?? original.reason_for_visit,
        notes: input.notes ?? original.notes,
      },
      trx,
    );

    // Link rescheduled_from_id
    await trx('appointments')
      .where({ id: newAppointment.id })
      .update({
        rescheduled_from_id: original.id,
      });

    return await findById(newAppointment.id, trx);
  });
}

export async function findAll(
  query: AppointmentQuery,
  trx: Knex = db,
): Promise<{ items: Appointment[]; meta: PageMeta }> {
  const {
    page,
    limit,
    doctor_id,
    patient_id,
    department_id,
    date,
    from_date,
    to_date,
    status,
    search,
  } = query;

  const offset = (page - 1) * limit;

  const baseQuery = trx('appointments as a')
    .leftJoin('patients as p', 'a.patient_id', 'p.id')
    .leftJoin('doctors as d', 'a.doctor_id', 'd.id')
    .leftJoin('departments as dep', 'a.department_id', 'dep.id')
    .leftJoin('appointment_types as at', 'a.appointment_type_id', 'at.id');

  if (doctor_id) baseQuery.where('a.doctor_id', doctor_id);
  if (patient_id) baseQuery.where('a.patient_id', patient_id);
  if (department_id) baseQuery.where('a.department_id', department_id);
  if (status) baseQuery.where('a.status', status);

  if (date) {
    baseQuery.where('a.appointment_date', date);
  } else {
    if (from_date) baseQuery.where('a.appointment_date', '>=', from_date);
    if (to_date) baseQuery.where('a.appointment_date', '<=', to_date);
  }

  if (search) {
    baseQuery.where((builder) => {
      builder
        .whereILike('p.first_name', `%${search}%`)
        .orWhereILike('p.last_name', `%${search}%`)
        .orWhereILike('p.hn', `%${search}%`)
        .orWhereILike('p.phone', `%${search}%`)
        .orWhereILike('d.first_name', `%${search}%`)
        .orWhereILike('d.last_name', `%${search}%`);
    });
  }

  const countResult = await baseQuery.clone().count<{ count: string | number }>('a.id as count').first();
  const total = Number(countResult?.count ?? 0);

  const items = await baseQuery
    .clone()
    .select(
      'a.*',
      'p.hn as patient_hn',
      trx.raw("CONCAT(p.first_name, ' ', p.last_name) as patient_name"),
      'p.phone as patient_phone',
      trx.raw("CONCAT(d.first_name, ' ', d.last_name) as doctor_name"),
      'dep.name as department_name',
      'at.name as appointment_type_name',
      'at.color as appointment_type_color',
      'at.duration_minutes as appointment_type_duration',
    )
    .orderBy('a.appointment_date', 'desc')
    .orderBy('a.start_time', 'asc')
    .limit(limit)
    .offset(offset);

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

export async function findByPatientId(
  patientId: string,
  query: AppointmentQuery,
  trx: Knex = db,
): Promise<{ items: Appointment[]; meta: PageMeta }> {
  return await findAll({ ...query, patient_id: patientId }, trx);
}
