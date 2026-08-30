import { api } from './client';
import type { Department, ApiResponse } from '@/types';

export async function getDepartmentsApi(): Promise<Department[]> {
  const { data } = await api.get<ApiResponse<Department[]>>('/departments');
  return data.data;
}

export async function getDepartmentByIdApi(id: string): Promise<Department> {
  const { data } = await api.get<ApiResponse<Department>>(`/departments/${id}`);
  return data.data;
}

export async function createDepartmentApi(input: Partial<Department>): Promise<Department> {
  const { data } = await api.post<ApiResponse<Department>>('/departments', input);
  return data.data;
}

export async function updateDepartmentApi(
  id: string,
  input: Partial<Department>,
): Promise<Department> {
  const { data } = await api.patch<ApiResponse<Department>>(`/departments/${id}`, input);
  return data.data;
}

export async function deleteDepartmentApi(id: string): Promise<void> {
  await api.delete(`/departments/${id}`);
}
