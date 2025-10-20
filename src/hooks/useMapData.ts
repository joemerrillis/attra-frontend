import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface MapPin {
  id: string;
  location_id: string;
  location_name: string;
  coordinates: { lat: number; lng: number };
  scan_count: number;
  recent_scans: Array<{
    id: string;
    scanned_at: string;
    campaign_name: string;
  }>;
}

export function useMapData() {
  return useQuery({
    queryKey: ['map-data'],
    queryFn: async () => {
      // Get all scans with location data
      const { data: scans, error } = await supabase
        .from('qr_scans')
        .select(`
          id,
          scanned_at,
          location:locations (
            id,
            name,
            coordinates
          ),
          qr_link:qr_links (
            campaign:campaigns (
              name
            )
          )
        `)
        .order('scanned_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      // Group by location
      const locationMap = new Map<string, MapPin>();

      scans?.forEach((scan: any) => {
        if (!scan.location?.coordinates) return;

        const locationId = scan.location.id;
        const existing = locationMap.get(locationId);

        if (existing) {
          existing.scan_count++;
          existing.recent_scans.push({
            id: scan.id,
            scanned_at: scan.scanned_at,
            campaign_name: scan.qr_link?.campaign?.name || 'Unknown',
          });
        } else {
          locationMap.set(locationId, {
            id: locationId,
            location_id: locationId,
            location_name: scan.location.name,
            coordinates: scan.location.coordinates,
            scan_count: 1,
            recent_scans: [{
              id: scan.id,
              scanned_at: scan.scanned_at,
              campaign_name: scan.qr_link?.campaign?.name || 'Unknown',
            }],
          });
        }
      });

      return Array.from(locationMap.values());
    },
    refetchInterval: 60000, // Refresh every minute
  });
}
