import { api } from '@/lib/api';
import type {
  Patient,
  CreatePatientInput,
  PaginatedResponse,
  ApiResponse,
  Appointment,
} from '@/types';

export interface GetPatientsParams {
  search?: string;
  page?: number;
  limit?: number;
}

export async function getPatients(
  params: GetPatientsParams = {},
): Promise<PaginatedResponse<Patient>> {
  const { data } = await api.get<PaginatedResponse<Patient>>('/patients', {
    params,
  });
  return data;
}

export async function getPatientById(id: string): Promise<Patient> {
  const { data } = await api.get<ApiResponse<Patient>>(`/patients/${id}`);
  return data.data;
}

export async function createPatient(input: CreatePatientInput): Promise<Patient> {
  const { data } = await api.post<ApiResponse<Patient>>('/patients', input);
  return data.data;
}

export async function getPatientAppointmentHistory(
  patientId: string,
): Promise<Appointment[]> {
  const { data } = await api.get<ApiResponse<Appointment[]>>(
    `/patients/${patientId}/appointments`,
  );
  return data.data;
}
