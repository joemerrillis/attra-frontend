import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

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

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export function useMapSummary() {
  return useQuery({
    queryKey: ['map', 'summary'],
    queryFn: async (): Promise<MapSummary> => {
      console.log('🗺️ [useMapSummary] Fetching map data...');

      // TEMPORARY: Return mock data until backend is ready
      // TODO: Remove this and uncomment API fetch below
      console.log('🗺️ [useMapSummary] Using MOCK DATA (backend not ready)');
      const mockData: MapSummary = {
        locations: [
          {
            location_id: 'loc_1',
            location_name: 'San Francisco Office',
            latitude: 37.7749,
            longitude: -122.4194,
            scans_today: 5,
            contacts_pending: 3,
            contacts: [
              {
                id: 'contact_1',
                name: 'John Doe',
                email: 'john@example.com',
                scanned_at: new Date().toISOString(),
                follow_up_status: 'pending',
              },
            ],
          },
          {
            location_id: 'loc_2',
            location_name: 'New York Office',
            latitude: 40.7128,
            longitude: -74.0060,
            scans_today: 0,
            contacts_pending: 7,
            contacts: [],
          },
        ],
        totalContactsPending: 10,
        totalLocations: 2,
      };

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('✅ [useMapSummary] Mock data returned successfully');
      return mockData;

      /* UNCOMMENT THIS WHEN BACKEND IS READY:

      // Get JWT token from Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      console.log('🗺️ [useMapSummary] Auth token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');

      const url = `${API_BASE}/api/realtime/map-summary`;
      console.log('🗺️ [useMapSummary] Request URL:', url);

      try {
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },
        });

        console.log('🗺️ [useMapSummary] Response status:', response.status);
        console.log('🗺️ [useMapSummary] Response ok:', response.ok);

        if (!response.ok) {
          let errorDetails = `HTTP ${response.status}`;
          try {
            const errorBody = await response.json();
            console.error('❌ [useMapSummary] Error response body:', errorBody);
            errorDetails = errorBody.message || errorBody.error || errorDetails;
          } catch (e) {
            console.error('❌ [useMapSummary] Could not parse error body');
          }
          throw new Error(`Failed to fetch map summary: ${errorDetails}`);
        }

        const data = await response.json() as MapSummary;
        console.log('✅ [useMapSummary] Success! Data:', data);
        return data;
      } catch (error) {
        console.error('❌ [useMapSummary] Fetch error:', error);
        throw error;
      }
      */
    },
    staleTime: 30 * 1000,            // 30 seconds
    refetchInterval: false,           // Disable auto-refresh for now to debug
    refetchOnWindowFocus: false,      // Don't refetch on window focus
    refetchOnReconnect: false,        // Don't refetch on reconnect
    refetchIntervalInBackground: false, // Don't refetch when tab is not visible
    retry: false,                     // Disable retries so we can see the error immediately
  });
}
