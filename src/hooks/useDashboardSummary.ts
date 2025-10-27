import { useQuery } from '@tanstack/react-query';

export interface DashboardSummary {
  campaignCount: number;
  assetCount: number;
  todayScans: number;
  contactsReady: number;
  emailsSentToday: number;
  scansByLocation: Array<{
    name: string;
    count: number;
  }>;
}

// Mock data for development (remove when backend endpoint is ready)
const MOCK_SUMMARY: DashboardSummary = {
  campaignCount: 2,
  assetCount: 8,
  todayScans: 5,
  contactsReady: 3,
  emailsSentToday: 1,
  scansByLocation: [
    { name: 'Downtown Coffee', count: 3 },
    { name: 'Uptown Bakery', count: 2 },
  ],
};

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => {
      // TODO: Replace with real API call when backend is ready
      // const response = await fetch('/api/realtime/dashboard-summary');
      // if (!response.ok) throw new Error('Failed to fetch dashboard summary');
      // return response.json() as Promise<DashboardSummary>;

      // For now, return mock data with simulated network delay
      return new Promise<DashboardSummary>((resolve) => {
        setTimeout(() => resolve(MOCK_SUMMARY), 500);
      });
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refresh every minute
  });
}
