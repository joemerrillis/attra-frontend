import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Wifi, WifiOff, Sparkles } from 'lucide-react';
import { useMapData } from '@/hooks/useMapData';
import { useRealtimeScans } from '@/hooks/useRealtimeScans';
import { useFeatureGate } from '@/hooks/useFeatureGate';
import {
  initMapbox,
  DEFAULT_MAP_CONFIG,
  createPinMarker,
  addMapStyles,
} from '@/lib/mapbox-config';
import { MapUpgradePrompt } from './MapUpgradePrompt';
import { format } from 'date-fns';

export function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<Map<string, mapboxgl.Marker>>(new Map());

  const [mapInitialized, setMapInitialized] = useState(false);

  const { data: mapData, isLoading } = useMapData();
  const { recentScans, isConnected } = useRealtimeScans();
  const { hasAccess: hasMapAccess, isLoading: checkingAccess } = useFeatureGate('map_view');
  const { hasAccess: hasRealtimeAccess } = useFeatureGate('realtime_map');

  // Initialize Mapbox
  useEffect(() => {
    if (!hasMapAccess) return;

    const initialized = initMapbox();
    if (initialized) {
      addMapStyles();
      setMapInitialized(true);
    }
  }, [hasMapAccess]);

  // Create map instance
  useEffect(() => {
    if (!mapInitialized || !mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      ...DEFAULT_MAP_CONFIG,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
    };
  }, [mapInitialized]);

  // Update markers when data changes
  useEffect(() => {
    if (!map.current || !mapData || mapData.length === 0) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current.clear();

    // Add new markers
    if (map.current) {
      const currentMap = map.current;
      mapData.forEach(pin => {
        const el = createPinMarker(pin.scan_count, false);

        const marker = new mapboxgl.Marker(el)
          .setLngLat([pin.coordinates.lng, pin.coordinates.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`
                <div class="p-2">
                  <h4 class="font-semibold mb-1">${pin.location_name}</h4>
                  <p class="text-sm text-muted-foreground mb-2">
                    ${pin.scan_count} scan${pin.scan_count !== 1 ? 's' : ''}
                  </p>
                  ${pin.recent_scans.slice(0, 3).map(scan => `
                    <div class="text-xs text-muted-foreground py-1 border-t">
                      ${scan.campaign_name} • ${format(new Date(scan.scanned_at), 'MMM d, h:mm a')}
                    </div>
                  `).join('')}
                </div>
              `)
          )
          .addTo(currentMap);

        markers.current.set(pin.id, marker);
      });
    }

    // Fit bounds to show all markers
    if (mapData.length > 0 && map.current) {
      const bounds = new mapboxgl.LngLatBounds();
      mapData.forEach(pin => {
        bounds.extend([pin.coordinates.lng, pin.coordinates.lat]);
      });
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 12 });
    }
  }, [mapData]);

  // Handle real-time scans (Pro tier only)
  useEffect(() => {
    if (!hasRealtimeAccess || !map.current || recentScans.length === 0) return;

    // Find the first marker and trigger pulse
    const marker = Array.from(markers.current.values())[0];

    if (marker) {
      const el = marker.getElement();
      el.classList.add('pulsing');

      // Remove pulse after animation
      setTimeout(() => {
        el.classList.remove('pulsing');
      }, 2000);
    }
  }, [recentScans, hasRealtimeAccess]);

  if (checkingAccess) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!hasMapAccess) {
    return <MapUpgradePrompt />;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Scan Locations
        </CardTitle>

        {hasRealtimeAccess && (
          <div className="flex items-center gap-2 text-sm">
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4 text-green-600" />
                <span className="text-muted-foreground">Live</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Connecting...</span>
              </>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[400px] w-full rounded-lg" />
        ) : (
          <div
            ref={mapContainer}
            className="h-[400px] w-full rounded-lg overflow-hidden border"
          />
        )}

        {hasRealtimeAccess && (
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Real-time updates enabled
          </p>
        )}
      </CardContent>
    </Card>
  );
}
