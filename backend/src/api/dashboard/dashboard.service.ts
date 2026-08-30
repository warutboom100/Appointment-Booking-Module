import type { Knex } from 'knex';
import { db } from '../../knex/db';
import { getCurrentBangkokDate, getDayOfWeekFromDate } from '../appointments/appointment.fn';
import type { DashboardStatsQuery, DashboardSummaryQuery } from './dashboard.schema';

export interface DashboardSummaryResult {
  date: string;
  total_appointments: number;
  status_breakdown: {
    booked: number;
    confirmed: number;
    checked_in: number;
    in_progress: number;
    completed: number;
    cancelled: number;
    no_show: number;
    rescheduled: number;
  };
  doctors_on_duty_count: number;
  today_queue: Array<{
    id: string;
    patient_hn: string;
    patient_name: string;
    patient_phone: string | null;
    doctor_name: string;
    department_name: string;
    appointment_type_name: string;
    appointment_type_color: string | null;
    start_time: string;
    end_time: string;
    status: string;
  }>;
}

export interface DashboardStatsResult {
  from_date: string;
  to_date: string;
  total_appointments: number;
  completed_count: number;
  cancelled_count: number;
  no_show_count: number;
  completion_rate: number;
  cancellation_rate: number;
  daily_trend: Array<{
    date: string;
    total: number;
    completed: number;
    cancelled: number;
  }>;
  department_breakdown: Array<{
    department_id: string;
    department_name: string;
    count: number;
  }>;
  top_appointment_types: Array<{
    appointment_type_id: string;
    name: string;
    count: number;
  }>;
}

export async function getSummary(
  query: DashboardSummaryQuery,
  trx: Knex = db,
): Promise<DashboardSummaryResult> {
  const targetDate = query.date || getCurrentBangkokDate();
  const { department_id, doctor_id } = query;

  // 1. Query appointments for targetDate
  const apptQuery = trx('appointments as a')
    .leftJoin('patients as p', 'a.patient_id', 'p.id')
    .leftJoin('doctors as d', 'a.doctor_id', 'd.id')
    .leftJoin('departments as dep', 'a.department_id', 'dep.id')
    .leftJoin('appointment_types as at', 'a.appointment_type_id', 'at.id')
    .where('a.appointment_date', targetDate);

  if (department_id) {
    apptQuery.where('a.department_id', department_id);
  }
  if (doctor_id) {
    apptQuery.where('a.doctor_id', doctor_id);
  }

  const appointments = await apptQuery.select(
    'a.id',
    'a.status',
    'a.start_time',
    'a.end_time',
    'p.hn as patient_hn',
    trx.raw("CONCAT(p.first_name, ' ', p.last_name) as patient_name"),
    'p.phone as patient_phone',
    trx.raw("CONCAT(d.first_name, ' ', d.last_name) as doctor_name"),
    'dep.name as department_name',
    'at.name as appointment_type_name',
    'at.color as appointment_type_color',
  ).orderBy('a.start_time', 'asc');

  // Status breakdown
  const status_breakdown = {
    booked: 0,
    confirmed: 0,
    checked_in: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
    no_show: 0,
    rescheduled: 0,
  };

  for (const appt of appointments) {
    const s = appt.status as keyof typeof status_breakdown;
    if (status_breakdown[s] !== undefined) {
      status_breakdown[s]++;
    }
  }

  // 2. Count active doctors on duty for targetDate
  const dayOfWeek = getDayOfWeekFromDate(targetDate);
  const docBaseQuery = trx('doctors as d').where('d.is_active', true);
  if (department_id) {
    docBaseQuery.where('d.department_id', department_id);
  }
  if (doctor_id) {
    docBaseQuery.where('d.id', doctor_id);
  }

  const activeDoctors = await docBaseQuery.select('d.id');
  const activeDoctorIds = activeDoctors.map((d) => d.id);

  let doctorsOnDutyCount = 0;
  if (activeDoctorIds.length > 0) {
    // Check recurring schedules
    const scheduledDoctors = await trx('doctor_schedules')
      .whereIn('doctor_id', activeDoctorIds)
      .where('day_of_week', dayOfWeek)
      .where('is_available', true)
      .distinct('doctor_id');

    const scheduledDocIds = new Set(scheduledDoctors.map((s) => s.doctor_id));

    // Check overrides
    const overrides = await trx('schedule_overrides')
      .whereIn('doctor_id', activeDoctorIds)
      .where('override_date', targetDate);

    for (const ov of overrides) {
      if (ov.is_available) {
        scheduledDocIds.add(ov.doctor_id);
      } else {
        scheduledDocIds.delete(ov.doctor_id);
      }
    }

    doctorsOnDutyCount = scheduledDocIds.size;
  }

  return {
    date: targetDate,
    total_appointments: appointments.length,
    status_breakdown,
    doctors_on_duty_count: doctorsOnDutyCount,
    today_queue: appointments.map((a) => ({
      id: a.id,
      patient_hn: a.patient_hn || '',
      patient_name: a.patient_name || '',
      patient_phone: a.patient_phone || null,
      doctor_name: a.doctor_name || '',
      department_name: a.department_name || '',
      appointment_type_name: a.appointment_type_name || '',
      appointment_type_color: a.appointment_type_color || null,
      start_time: a.start_time.slice(0, 5),
      end_time: a.end_time.slice(0, 5),
      status: a.status,
    })),
  };
}

export async function getStats(
  query: DashboardStatsQuery,
  trx: Knex = db,
): Promise<DashboardStatsResult> {
  const to_date = query.to_date || getCurrentBangkokDate();
  // Default to 30 days before to_date if from_date not specified
  let from_date = query.from_date;
  if (!from_date) {
    const d = new Date(to_date);
    d.setDate(d.getDate() - 30);
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    from_date = formatter.format(d);
  }

  const { department_id, doctor_id } = query;

  // Base appointments query in date range
  const baseQuery = trx('appointments as a')
    .leftJoin('departments as dep', 'a.department_id', 'dep.id')
    .leftJoin('appointment_types as at', 'a.appointment_type_id', 'at.id')
    .where('a.appointment_date', '>=', from_date)
    .where('a.appointment_date', '<=', to_date);

  if (department_id) {
    baseQuery.where('a.department_id', department_id);
  }
  if (doctor_id) {
    baseQuery.where('a.doctor_id', doctor_id);
  }

  const rows = await baseQuery.select(
    'a.id',
    'a.status',
    'a.appointment_date',
    'a.department_id',
    'dep.name as department_name',
    'a.appointment_type_id',
    'at.name as appointment_type_name',
  );

  const total = rows.length;
  let completed = 0;
  let cancelled = 0;
  let no_show = 0;

  const dailyMap = new Map<string, { total: number; completed: number; cancelled: number }>();
  const deptMap = new Map<string, { name: string; count: number }>();
  const typeMap = new Map<string, { name: string; count: number }>();

  for (const r of rows) {
    if (r.status === 'completed') completed++;
    if (r.status === 'cancelled') cancelled++;
    if (r.status === 'no_show') no_show++;

    // Daily aggregation
    const dateKey = r.appointment_date;
    const dailyEntry = dailyMap.get(dateKey) || { total: 0, completed: 0, cancelled: 0 };
    dailyEntry.total++;
    if (r.status === 'completed') dailyEntry.completed++;
    if (r.status === 'cancelled') dailyEntry.cancelled++;
    dailyMap.set(dateKey, dailyEntry);

    // Department aggregation
    if (r.department_id) {
      const deptEntry = deptMap.get(r.department_id) || {
        name: r.department_name || 'Unknown Department',
        count: 0,
      };
      deptEntry.count++;
      deptMap.set(r.department_id, deptEntry);
    }

    // Appointment Type aggregation
    if (r.appointment_type_id) {
      const typeEntry = typeMap.get(r.appointment_type_id) || {
        name: r.appointment_type_name || 'Unknown Type',
        count: 0,
      };
      typeEntry.count++;
      typeMap.set(r.appointment_type_id, typeEntry);
    }
  }

  const completion_rate = total > 0 ? Number(((completed / total) * 100).toFixed(1)) : 0;
  const cancellation_rate = total > 0 ? Number(((cancelled / total) * 100).toFixed(1)) : 0;

  const daily_trend = Array.from(dailyMap.entries())
    .map(([date, data]) => ({
      date,
      total: data.total,
      completed: data.completed,
      cancelled: data.cancelled,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const department_breakdown = Array.from(deptMap.entries())
    .map(([department_id, data]) => ({
      department_id,
      department_name: data.name,
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count);

  const top_appointment_types = Array.from(typeMap.entries())
    .map(([appointment_type_id, data]) => ({
      appointment_type_id,
      name: data.name,
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    from_date,
    to_date,
    total_appointments: total,
    completed_count: completed,
    cancelled_count: cancelled,
    no_show_count: no_show,
    completion_rate,
    cancellation_rate,
    daily_trend,
    department_breakdown,
    top_appointment_types,
  };
}
