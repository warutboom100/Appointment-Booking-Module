import { api } from './client';
import type { ApiResponse, DashboardSummaryData } from '@/types';

export interface DashboardSummaryParams {
  date?: string;
  department_id?: string;
  doctor_id?: string;
}

export async function getDashboardSummaryApi(
  params?: DashboardSummaryParams,
): Promise<DashboardSummaryData> {
  const { data } = await api.get<ApiResponse<DashboardSummaryData>>('/dashboard/summary', {
    params,
  });
  return data.data;
}
