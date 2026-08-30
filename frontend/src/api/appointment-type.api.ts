import { api } from './client';
import type { AppointmentType, ApiResponse, PaginatedResponse } from '@/types';

export interface GetAppointmentTypesParams {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: boolean;
}

export async function getAppointmentTypesApi(
  params?: GetAppointmentTypesParams,
): Promise<PaginatedResponse<AppointmentType>> {
  const { data } = await api.get<PaginatedResponse<AppointmentType>>('/appointment-types', {
    params,
  });
  return data;
}

export async function getAllAppointmentTypesListApi(): Promise<AppointmentType[]> {
  const { data } = await api.get<PaginatedResponse<AppointmentType>>('/appointment-types', {
    params: { limit: 100, is_active: true },
  });
  return data.data;
}

export async function getAppointmentTypeByIdApi(id: string): Promise<AppointmentType> {
  const { data } = await api.get<ApiResponse<AppointmentType>>(`/appointment-types/${id}`);
  return data.data;
}

export async function createAppointmentTypeApi(
  input: Partial<AppointmentType>,
): Promise<AppointmentType> {
  const { data } = await api.post<ApiResponse<AppointmentType>>('/appointment-types', input);
  return data.data;
}

export async function updateAppointmentTypeApi(
  id: string,
  input: Partial<AppointmentType>,
): Promise<AppointmentType> {
  const { data } = await api.patch<ApiResponse<AppointmentType>>(`/appointment-types/${id}`, input);
  return data.data;
}

export async function deleteAppointmentTypeApi(id: string): Promise<void> {
  await api.delete(`/appointment-types/${id}`);
}
