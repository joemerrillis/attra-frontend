
import { fetchWithAuth } from '@/lib/api-client';

export interface DashboardStats {
    totalScans: number;
    totalContacts: number;
    conversionRate: number;
    avgResponseTime: string;
    activeAssets: number;
    lastUpdated: string;
}

export interface ActivityItem {
    type: 'scan' | 'contact';
    title: string;
    description: string;
    timestamp: string;
}

export const dashboardApi = {
    getStats: async (): Promise<DashboardStats> => {
        return fetchWithAuth('/api/internal/dashboard/stats');
    },

    getActivity: async (): Promise<ActivityItem[]> => {
        return fetchWithAuth('/api/internal/dashboard/activity');
    }
};
