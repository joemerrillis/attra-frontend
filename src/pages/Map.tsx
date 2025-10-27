import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { RefreshCw, AlertCircle, Lock, Sparkles } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@/styles/map-animations.css';
import { initMapbox, DEFAULT_MAP_CONFIG } from '@/lib/mapbox-config';
import { useMapSummary } from '@/hooks/useMapSummary';
import { useFeatureGate } from '@/hooks/useFeatureGate';
import { useUpgradeAnalytics } from '@/hooks/useUpgradeAnalytics';
import { PinBottomSheet } from '@/components/map/PinBottomSheet';
import { MapEmptyState } from '@/components/map/MapEmptyState';
import { MapLoadingSkeleton } from '@/components/map/MapLoadingSkeleton';
import { MapControls } from '@/components/map/MapControls';
import { Button } from '@/components/ui/button';
import type { MapLocation } from '@/hooks/useMapSummary';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

export function MapPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Feature gate check for map access
  const {
    hasAccess: hasMapAccess,
    isLoading: isCheckingAccess,
    requiredPlan,
  } = useFeatureGate('map_view');

  // Analytics tracking
  const { trackPromptViewed, trackPromptClicked, trackFeatureGateEncountered } = useUpgradeAnalytics('map_page');

  // TEMPORARILY bypass React Query to debug infinite loop
  const [mapData, setMapData] = useState<{ locations: MapLocation[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Mapbox refs
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<Map<string, mapboxgl.Marker>>(new Map());

  // ALL HOOKS MUST BE BEFORE ANY EARLY RETURNS
  // Memoized handlers
  const handlePinClick = useCallback((location: MapLocation) => {
    // Always open bottom sheet, but PinBottomSheet will show different content
    // based on hasMapAccess prop
    setSelectedLocation(location);
    setSheetOpen(true);
  }, []);

  const handleSheetClose = useCallback(() => {
    setSheetOpen(false);
    setTimeout(() => setSelectedLocation(null), 300);
  }, []);

  // Map control handlers
  const handleZoomIn = useCallback(() => {
    map.current?.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    map.current?.zoomOut();
  }, []);

  const handleFitBounds = useCallback(() => {
    if (!map.current || !mapData?.locations || mapData.locations.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();
    mapData.locations.forEach(location => {
      if (location.latitude && location.longitude) {
        bounds.extend([location.longitude, location.latitude]);
      }
    });

    if (!bounds.isEmpty()) {
      map.current.fitBounds(bounds, {
        padding: { top: 100, bottom: 100, left: 50, right: 50 },
        maxZoom: 15,
      });
    }
  }, [mapData?.locations]);

  // Memoize expensive calculations - MUST be before early returns to avoid conditional hook errors
  const { totalContactsPending, totalLocations, hasLiveActivity } = useMemo(() => {
    if (!mapData?.locations) return { totalContactsPending: 0, totalLocations: 0, hasLiveActivity: false };

    return {
      totalContactsPending: mapData.locations.reduce((sum, loc) => sum + loc.contacts_pending, 0),
      totalLocations: mapData.locations.length,
      hasLiveActivity: mapData.locations.some(loc => loc.scans_today > 0),
    };
  }, [mapData?.locations]);

  // Track when feature gate is encountered (user sees locked map)
  useEffect(() => {
    if (!isCheckingAccess && !hasMapAccess) {
      trackFeatureGateEncountered('map_view', requiredPlan);
      trackPromptViewed('map_view', requiredPlan);
    }
  }, [isCheckingAccess, hasMapAccess, requiredPlan, trackFeatureGateEncountered, trackPromptViewed]);

  // Fetch data (bypassing React Query temporarily)
  useEffect(() => {
    console.log('🗺️ [Map] Loading mock data...');

    const mockData = {
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
              follow_up_status: 'pending' as const,
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
    };

    setTimeout(() => {
      console.log('✅ [Map] Mock data loaded');
      setMapData(mockData);
      setIsLoading(false);
    }, 500);
  }, []);

  // Initialize Mapbox map
  useEffect(() => {
    if (!mapContainer.current || map.current || isLoading || !mapData) return;

    console.log('🗺️ [Map] Initializing Mapbox...');

    const initialized = initMapbox();
    if (!initialized) {
      console.error('❌ [Map] Failed to initialize Mapbox - check VITE_MAPBOX_TOKEN');
      return;
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      ...DEFAULT_MAP_CONFIG,
      // Mobile-friendly settings
      touchZoomRotate: true,
      touchPitch: false,
      dragRotate: false,
      pitchWithRotate: false,
    });

    console.log('✅ [Map] Mapbox initialized successfully');
    map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    return () => {
      console.log('🗺️ [Map] Cleaning up Mapbox...');
      markers.current.forEach(marker => marker.remove());
      markers.current.clear();
      map.current?.remove();
      map.current = null;
    };
  }, [isLoading, mapData]);

  // Update markers when location data changes
  useEffect(() => {
    if (!map.current || !mapData?.locations) return;

    console.log('🗺️ [Map] Updating markers...', mapData.locations.length, 'locations');

    markers.current.forEach(marker => marker.remove());
    markers.current.clear();

    mapData.locations.forEach(location => {
      if (!location.latitude || !location.longitude) {
        console.warn(`⚠️ [Map] Location ${location.location_name} has no coordinates`);
        return;
      }

      const markerEl = document.createElement('div');
      markerEl.className = 'map-marker-container';

      const isPulsing = location.scans_today > 0;
      const hasContacts = location.contacts_pending > 0;

      markerEl.innerHTML = `
        <div class="relative w-12 h-12 cursor-pointer transition-transform hover:scale-110 focus:scale-110 focus:outline-none focus:ring-2 focus:ring-accent rounded-full"
             data-location-id="${location.location_id}"
             tabindex="0"
             role="button"
             aria-label="Location: ${location.location_name}, ${location.contacts_pending} contacts pending">
          <svg
            class="w-8 h-8 transition-colors ${hasContacts ? 'text-accent' : 'text-primary'}"
            fill="${hasContacts ? 'currentColor' : 'none'}"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
          ${isPulsing && hasContacts ? `
            <span class="absolute inset-0 flex items-center justify-center">
              <span class="absolute w-8 h-8 bg-accent opacity-75 rounded-full animate-ping"></span>
            </span>
          ` : ''}
          ${location.contacts_pending > 0 ? `
            <span class="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-accent text-accent-foreground text-xs font-semibold rounded-full border-2 border-background shadow-sm">
              ${location.contacts_pending > 99 ? '99+' : location.contacts_pending}
            </span>
          ` : ''}
        </div>
      `;

      // Combined handler for both click and keyboard activation
      const handleActivate = () => {
        console.log('🗺️ [Map] Marker activated:', location.location_name);
        handlePinClick(location);
      };

      markerEl.addEventListener('click', handleActivate);
      markerEl.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleActivate();
        }
      });

      const marker = new mapboxgl.Marker({
        element: markerEl,
        anchor: 'bottom',
      })
        .setLngLat([location.longitude, location.latitude])
        .addTo(map.current!);

      markers.current.set(location.location_id, marker);
    });

    if (mapData.locations.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();

      mapData.locations.forEach(location => {
        if (location.latitude && location.longitude) {
          bounds.extend([location.longitude, location.latitude]);
        }
      });

      if (!bounds.isEmpty()) {
        map.current.fitBounds(bounds, {
          padding: { top: 100, bottom: 100, left: 50, right: 50 },
          maxZoom: 15,
        });
      }
    }

    console.log('✅ [Map] Markers updated successfully');
  }, [mapData, handlePinClick]);

  // Keyboard navigation
  useEffect(() => {
    if (!map.current) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Close bottom sheet on Escape
      if (e.key === 'Escape' && sheetOpen) {
        handleSheetClose();
        return;
      }

      // Pan map with arrow keys (shift key = faster)
      const panDistance = e.shiftKey ? 100 : 50;
      switch (e.key) {
        case 'ArrowUp':
          map.current?.panBy([0, -panDistance]);
          e.preventDefault();
          break;
        case 'ArrowDown':
          map.current?.panBy([0, panDistance]);
          e.preventDefault();
          break;
        case 'ArrowLeft':
          map.current?.panBy([-panDistance, 0]);
          e.preventDefault();
          break;
        case 'ArrowRight':
          map.current?.panBy([panDistance, 0]);
          e.preventDefault();
          break;
        case '+':
        case '=':
          map.current?.zoomIn();
          e.preventDefault();
          break;
        case '-':
        case '_':
          map.current?.zoomOut();
          e.preventDefault();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sheetOpen, handleSheetClose]);

  // NOW we can do early returns - after ALL hooks are called
  if (isLoading || isCheckingAccess) {
    return <MapLoadingSkeleton />;
  }

  if (error) {
    console.error('🗺️ [Map] Error rendering:', error);

    const handleRetry = () => {
      console.log('🗺️ [Map] Retry button clicked - reloading...');
      setError(null);
      setIsLoading(true);
      // Re-trigger data fetch
      setTimeout(() => {
        const mockData = {
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
                  follow_up_status: 'pending' as const,
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
        };
        setMapData(mockData);
        setIsLoading(false);
      }, 500);
    };

    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)] px-6 text-center">
        <AlertCircle className="w-16 h-16 text-destructive mb-4 animate-pulse" />
        <h2 className="text-xl font-bold mb-2">Failed to load map data</h2>
        <p className="text-sm text-muted-foreground mb-1 max-w-md">
          {error instanceof Error ? error.message : 'Unknown error occurred'}
        </p>
        <p className="text-xs text-muted-foreground mb-6">
          Check your connection or try again
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reload Page
          </Button>
          <Button
            variant="accent"
            onClick={handleRetry}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!mapData?.locations || mapData.locations.length === 0) {
    return <MapEmptyState />;
  }

  return (
    <div
      className="relative w-full h-[calc(100vh-120px)] bg-muted/30"
      role="application"
      aria-label="Real-time map of locations with pending contacts"
    >
      <div
        className="absolute top-0 left-0 right-0 z-10 bg-background/95 backdrop-blur-sm border-b p-4"
        role="region"
        aria-label="Map statistics"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between max-w-screen-xl mx-auto gap-3 sm:gap-0">
          <div className="flex items-center gap-4">
            <div className="transition-transform hover:scale-105">
              <div
                className="text-2xl font-bold"
                aria-label={`${totalContactsPending} contacts ready`}
              >
                {totalContactsPending}
              </div>
              <div className="text-xs text-muted-foreground">
                ●{'>'}  Contacts ready
              </div>
            </div>
            <div className="h-8 w-px bg-border" aria-hidden="true" />
            <div className="transition-transform hover:scale-105">
              <div
                className="text-2xl font-bold"
                aria-label={`${totalLocations} active locations`}
              >
                {totalLocations}
              </div>
              <div className="text-xs text-muted-foreground">
                Active locations
              </div>
            </div>
          </div>

          {hasLiveActivity && (
            <div
              className="flex items-center gap-2 text-live"
              role="status"
              aria-live="polite"
              aria-label="Live activity detected"
            >
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-live opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-live" />
              </span>
              <span className="text-sm font-medium">Live</span>
            </div>
          )}
        </div>
      </div>

      <div
        ref={mapContainer}
        className={`absolute inset-0 pt-20 transition-all duration-300 ${
          !hasMapAccess ? 'blur-sm pointer-events-none' : ''
        }`}
        style={{ height: 'calc(100vh - 120px)' }}
        role="region"
        aria-label="Interactive map"
        tabIndex={0}
      />

      {/* FOMO Overlay - Only shown to users without map access */}
      {!hasMapAccess && (
        <div className="absolute inset-0 pt-20 flex items-center justify-center z-20 bg-background/80 backdrop-blur-sm">
          <div className="max-w-md mx-auto px-6 text-center">
            <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
              <Lock className="w-10 h-10 text-primary" />
            </div>

            <h2 className="text-3xl font-bold mb-3">
              {totalContactsPending} Contact{totalContactsPending !== 1 ? 's' : ''} Ready to Follow Up
            </h2>

            <p className="text-lg text-muted-foreground mb-2">
              See exactly where your leads are coming from on an interactive real-time map
            </p>

            <p className="text-sm text-muted-foreground mb-6">
              Track which locations are converting best and optimize your marketing strategy
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                onClick={() => {
                  trackPromptClicked('map_view', requiredPlan);
                  navigate('/upgrade?feature=map_view');
                }}
                className="gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Unlock Real-Time Map
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  trackPromptClicked('map_view', requiredPlan);
                  navigate('/upgrade');
                }}
              >
                View All Plans
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              {requiredPlan === 'starter'
                ? 'Included in Starter plan - Starting at $29/month'
                : requiredPlan === 'professional'
                ? 'Included in Professional plan - Starting at $99/month'
                : 'Upgrade to access this feature'
              }
            </p>
          </div>
        </div>
      )}

      <MapControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitBounds={handleFitBounds}
      />

      <PinBottomSheet
        location={selectedLocation}
        open={sheetOpen}
        onClose={handleSheetClose}
        hasAccess={hasMapAccess}
      />
    </div>
  );
}

// Export as Map for backward compatibility
export { MapPage as Map };
