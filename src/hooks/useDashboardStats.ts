import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { DashboardMetrics } from '@/lib/analytics-utils';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(`${API_BASE}/api/realtime/analytics`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();

      // Calculate conversion rate
      const conversionRate = data.snapshot.scans > 0
        ? Math.round((data.snapshot.contacts / data.snapshot.scans) * 100)
        : 0;

      return {
        totalScans: data.snapshot.scans,
        totalContacts: data.snapshot.contacts,
        conversionRate,
        avgResponseTime: '2h 15m', // TODO: Calculate from contact_responses
        activeCampaigns: data.snapshot.assets,
        lastUpdated: data.snapshot.lastUpdated,
      } as DashboardMetrics;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}
