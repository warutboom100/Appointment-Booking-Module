import { api } from './client';
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

export async function getPatientsApi(
  params: GetPatientsParams = {},
): Promise<PaginatedResponse<Patient>> {
  const { data } = await api.get<PaginatedResponse<Patient>>('/patients', {
    params,
  });
  return data;
}

export async function getPatientByIdApi(id: string): Promise<Patient> {
  const { data } = await api.get<ApiResponse<Patient>>(`/patients/${id}`);
  return data.data;
}

export async function createPatientApi(input: CreatePatientInput): Promise<Patient> {
  const { data } = await api.post<ApiResponse<Patient>>('/patients', input);
  return data.data;
}

export async function updatePatientApi(
  id: string,
  input: Partial<CreatePatientInput>,
): Promise<Patient> {
  const { data } = await api.patch<ApiResponse<Patient>>(`/patients/${id}`, input);
  return data.data;
}

export async function getPatientAppointmentHistoryApi(
  patientId: string,
): Promise<Appointment[]> {
  const { data } = await api.get<ApiResponse<Appointment[]>>(
    `/patients/${patientId}/appointments`,
  );
  return data.data;
}
