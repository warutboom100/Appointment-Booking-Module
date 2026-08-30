import { api } from './client';
import type { Doctor, ApiResponse } from '@/types';

export async function getDoctorsApi(departmentId?: string): Promise<Doctor[]> {
  const { data } = await api.get<ApiResponse<Doctor[]>>('/doctors', {
    params: departmentId ? { department_id: departmentId } : undefined,
  });
  return data.data;
}

export async function getDoctorByIdApi(id: string): Promise<Doctor> {
  const { data } = await api.get<ApiResponse<Doctor>>(`/doctors/${id}`);
  return data.data;
}

export async function createDoctorApi(input: Partial<Doctor>): Promise<Doctor> {
  const { data } = await api.post<ApiResponse<Doctor>>('/doctors', input);
  return data.data;
}

export async function updateDoctorApi(id: string, input: Partial<Doctor>): Promise<Doctor> {
  const { data } = await api.patch<ApiResponse<Doctor>>(`/doctors/${id}`, input);
  return data.data;
}

export async function deleteDoctorApi(id: string): Promise<void> {
  await api.delete(`/doctors/${id}`);
}
