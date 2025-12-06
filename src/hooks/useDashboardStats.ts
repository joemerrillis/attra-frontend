import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/dashboard-api';
// import type { DashboardMetrics } from '@/lib/analytics-utils';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
    refetchInterval: 30000,
  });
}
