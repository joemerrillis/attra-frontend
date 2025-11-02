import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';

export interface DashboardSummary {
  assetCount: number;
  todayScans: number;
  recentAssets: Array<{
    id: string;
    message_theme: string;
    status: 'pending' | 'generating' | 'completed' | 'failed';
    created_at: string;
    locations: {
      name: string;
    };
  }>;
}

export function useDashboardSummary() {
  const { tenant } = useAuth();

  return useQuery({
    queryKey: ['dashboard', 'summary', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) {
        throw new Error('No tenant ID available');
      }

      console.log('📊 [useDashboardSummary] Fetching dashboard summary for tenant:', tenant.id);

      // Real API call
      const data = await fetchWithAuth<DashboardSummary>(
        `/api/realtime/dashboard-summary`
      );

      console.log('✅ [useDashboardSummary] Dashboard summary loaded:', data);
      return data;
    },
    enabled: !!tenant?.id, // Only run query when tenant is loaded
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
  });
}
