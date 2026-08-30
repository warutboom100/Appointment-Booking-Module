import { api } from './client';
import type {
  Appointment,
  AppointmentType,
  AvailableSlotsData,
  CreateAppointmentInput,
  PaginatedResponse,
  ApiResponse,
  DashboardSummary,
} from '@/types';

// === Appointment Types ===
export async function getAppointmentTypesApi(): Promise<AppointmentType[]> {
  const { data } = await api.get<ApiResponse<AppointmentType[]>>('/appointment-types');
  return data.data;
}

// === Appointments (Core) ===
export interface GetAppointmentsParams {
  patient_id?: string;
  doctor_id?: string;
  department_id?: string;
  date?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export async function getAppointmentsApi(
  params: GetAppointmentsParams = {},
): Promise<PaginatedResponse<Appointment>> {
  const { data } = await api.get<PaginatedResponse<Appointment>>('/appointments', {
    params,
  });
  return data;
}

export async function getAppointmentByIdApi(id: string): Promise<Appointment> {
  const { data } = await api.get<ApiResponse<Appointment>>(`/appointments/${id}`);
  return data.data;
}

export async function getAvailableSlotsApi(params: {
  doctor_id: string;
  date: string;
  appointment_type_id: string;
}): Promise<AvailableSlotsData> {
  const { data } = await api.get<ApiResponse<AvailableSlotsData>>(
    '/appointments/available-slots',
    { params },
  );
  return data.data;
}

export async function bookAppointmentApi(input: CreateAppointmentInput): Promise<Appointment> {
  const { data } = await api.post<ApiResponse<Appointment>>('/appointments', input);
  return data.data;
}

export async function updateAppointmentStatusApi(
  id: string,
  status: string,
): Promise<Appointment> {
  const { data } = await api.patch<ApiResponse<Appointment>>(
    `/appointments/${id}/status`,
    { status },
  );
  return data.data;
}

export async function cancelAppointmentApi(
  id: string,
  cancellation_reason: string,
): Promise<Appointment> {
  const { data } = await api.patch<ApiResponse<Appointment>>(
    `/appointments/${id}/cancel`,
    { cancellation_reason },
  );
  return data.data;
}

export async function rescheduleAppointmentApi(
  id: string,
  input: {
    appointment_date: string;
    start_time: string;
    reason_for_visit?: string | null;
    notes?: string | null;
  },
): Promise<Appointment> {
  const { data } = await api.post<ApiResponse<Appointment>>(
    `/appointments/${id}/reschedule`,
    input,
  );
  return data.data;
}

// === Dashboard ===
export async function getDashboardSummaryApi(): Promise<DashboardSummary> {
  const { data } = await api.get<ApiResponse<DashboardSummary>>('/dashboard/summary');
  return data.data;
}
