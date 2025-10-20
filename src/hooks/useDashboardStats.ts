import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { DashboardMetrics } from '@/lib/analytics-utils';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // Fetch data directly from Supabase
      const { data: scans } = await supabase
        .from('qr_scans')
        .select('id');

      const { data: contacts } = await supabase
        .from('contacts')
        .select('id');

      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id')
        .eq('status', 'active');

      const totalScans = scans?.length || 0;
      const totalContacts = contacts?.length || 0;
      const conversionRate = totalScans > 0
        ? Math.round((totalContacts / totalScans) * 100)
        : 0;

      return {
        totalScans,
        totalContacts,
        conversionRate,
        avgResponseTime: '2h 15m', // TODO: Calculate from contact_responses
        activeCampaigns: campaigns?.length || 0,
        lastUpdated: new Date().toISOString(),
      } as DashboardMetrics;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}
