import { useQuery } from '@tanstack/react-query';
import { getDashboardSummaryApi, type DashboardSummaryParams } from '@/api/dashboard.api';

export function useDashboardSummary(params?: DashboardSummaryParams) {
  return useQuery({
    queryKey: ['dashboard-summary', params],
    queryFn: () => getDashboardSummaryApi(params),
    refetchInterval: 30000, // Refresh every 30 seconds for live clinic queue monitoring
  });
}
