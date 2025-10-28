import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';

export interface MapLocation {
  location_id: string;
  location_name: string;
  latitude: number;
  longitude: number;
  scans_today: number;
  contacts_pending: number;
  contacts: Array<{
    id: string;
    name: string;
    email: string;
    scanned_at: string;
    follow_up_status: 'pending' | 'contacted' | 'converted';
  }>;
}

export interface MapSummary {
  locations: MapLocation[];
  totalContactsPending?: number;  // Optional - returned by backend
  totalLocations?: number;         // Optional - returned by backend
  total_pending_contacts?: number; // Backend uses snake_case
}

export function useMapSummary() {
  const { tenant } = useAuth();

  return useQuery({
    queryKey: ['map', 'summary', tenant?.id],
    queryFn: async (): Promise<MapSummary> => {
      if (!tenant?.id) {
        throw new Error('No tenant ID available');
      }

      console.log('🗺️ [useMapSummary] Fetching map summary for tenant:', tenant.id);

      // Real API call
      const data = await fetchWithAuth<MapSummary>(
        `/api/realtime/tenants/${tenant.id}/map-summary`
      );

      console.log('✅ [useMapSummary] Map summary loaded:', data);
      return data;
    },
    enabled: !!tenant?.id, // Only run query when tenant is loaded
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
  });
}
