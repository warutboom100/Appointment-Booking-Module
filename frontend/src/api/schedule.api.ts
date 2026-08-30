import { api } from './client';
import type {
  DoctorSchedule,
  ScheduleOverride,
  ApiResponse,
} from '@/types';

// === Doctor Weekly Schedules ===
export interface CreateSchedulePayload {
  day_of_week: number;
  start_time: string;
  end_time: string;
  break_start?: string | null;
  break_end?: string | null;
  is_available?: boolean;
  max_appointments?: number | null;
}

export async function getDoctorSchedulesApi(doctorId: string): Promise<DoctorSchedule[]> {
  const { data } = await api.get<ApiResponse<DoctorSchedule[]>>(
    `/doctors/${doctorId}/schedules`,
  );
  return data.data;
}

export async function createDoctorScheduleApi(
  doctorId: string,
  input: CreateSchedulePayload,
): Promise<DoctorSchedule> {
  const { data } = await api.post<ApiResponse<DoctorSchedule>>(
    `/doctors/${doctorId}/schedules`,
    input,
  );
  return data.data;
}

export async function updateDoctorScheduleApi(
  scheduleId: string,
  input: Partial<CreateSchedulePayload>,
): Promise<DoctorSchedule> {
  const { data } = await api.patch<ApiResponse<DoctorSchedule>>(
    `/schedules/${scheduleId}`,
    input,
  );
  return data.data;
}

export async function deleteDoctorScheduleApi(scheduleId: string): Promise<void> {
  await api.delete(`/schedules/${scheduleId}`);
}

// === Doctor Schedule Overrides ===
export interface CreateOverridePayload {
  override_date: string; // YYYY-MM-DD
  is_available: boolean;
  start_time?: string | null;
  end_time?: string | null;
  break_start?: string | null;
  break_end?: string | null;
  reason?: string | null;
}

export async function getDoctorOverridesApi(
  doctorId: string,
  params?: { from_date?: string; to_date?: string },
): Promise<ScheduleOverride[]> {
  const { data } = await api.get<ApiResponse<ScheduleOverride[]>>(
    `/doctors/${doctorId}/overrides`,
    { params },
  );
  return data.data;
}

export async function createDoctorOverrideApi(
  doctorId: string,
  input: CreateOverridePayload,
): Promise<ScheduleOverride> {
  const { data } = await api.post<ApiResponse<ScheduleOverride>>(
    `/doctors/${doctorId}/overrides`,
    input,
  );
  return data.data;
}

export async function updateDoctorOverrideApi(
  overrideId: string,
  input: Partial<CreateOverridePayload>,
): Promise<ScheduleOverride> {
  const { data } = await api.patch<ApiResponse<ScheduleOverride>>(
    `/overrides/${overrideId}`,
    input,
  );
  return data.data;
}

export async function deleteDoctorOverrideApi(overrideId: string): Promise<void> {
  await api.delete(`/overrides/${overrideId}`);
}

export interface GetOverridesParams {
  doctor_id?: string;
  department_id?: string;
  from_date?: string;
  to_date?: string;
  is_available?: boolean;
}

export async function getAllOverridesApi(
  params?: GetOverridesParams,
): Promise<ScheduleOverride[]> {
  const { data } = await api.get<ApiResponse<ScheduleOverride[]>>('/overrides', {
    params,
  });
  return data.data;
}
