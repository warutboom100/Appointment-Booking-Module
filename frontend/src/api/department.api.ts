import { api } from './client';
import type { Department, ApiResponse, PaginatedResponse } from '@/types';

export interface GetDepartmentsParams {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: boolean;
}

export async function getDepartmentsApi(params?: GetDepartmentsParams): Promise<PaginatedResponse<Department>> {
  const { data } = await api.get<PaginatedResponse<Department>>('/departments', {
    params,
  });
  return data;
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
