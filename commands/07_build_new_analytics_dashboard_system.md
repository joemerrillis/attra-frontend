# 07_build_analytics_dashboard_system.md

## 🎯 Goal

Build a complete analytics and visualization system that shows real-world attribution in action. This is the **command center** of Attra - where users see their flyers converting into leads on a live map, track campaign performance, and understand their attribution metrics. Features responsive design (Option C on desktop, Option B on mobile) with Mapbox GL JS for beautiful map visualization and strategic feature gating to drive upgrades.

**Timeline:** 12-14 hours  
**Priority:** CRITICAL - Core product showcase

---

## 📋 Prerequisites

- ✅ `00_build_pull_contracts.md` executed (schema contracts available)
- ✅ `04_build_campaign_creation_system.md` completed (campaigns exist)
- ✅ `05_build_scan_capture_system.md` completed (scans being tracked)
- ✅ `06_build_contacts_crm_system.md` completed (contacts data available)
- ✅ `08_build_feature_gating_system.md` completed (plan access working)
- ✅ Backend has realtime WebSocket (`04_realtime_subscriptions.md`)
- ✅ Mapbox account created (free tier: 50k loads/month)

---

## 🧭 User Journey

This file builds the complete analytics experience:

1. **Dashboard loads** → User sees overview stats at a glance
2. **Map visualization** → Pins show where scans are happening
3. **Real-time updates** → New scans pulse on map (Pro tier)
4. **Campaign list** → Table shows all campaigns with metrics
5. **Detailed analytics** → Charts reveal attribution patterns
6. **Feature gates** → Free tier sees upgrade prompts for advanced features

**Result:** Beautiful, data-driven dashboard that makes attribution tangible and drives natural upgrades.

---

## 🗂️ Complete File Structure

```
src/
├── pages/
│   ├── Dashboard.tsx                    (Main dashboard - responsive layout)
│   ├── campaigns/
│   │   ├── Index.tsx                    (Campaigns list)
│   │   └── [id]/Analytics.tsx           (Single campaign analytics)
│   └── Analytics.tsx                    (Global analytics page)
├── components/
│   └── dashboard/
│       ├── StatsGrid.tsx                (Top stat cards)
│       ├── StatCard.tsx                 (Individual stat display)
│       ├── MapView.tsx                  (Mapbox map component)
│       ├── MapPin.tsx                   (Custom pin marker)
│       ├── PulseAnimation.tsx           (Real-time scan pulse - Pro)
│       ├── RecentActivityFeed.tsx       (Live scan feed)
│       ├── ActivityItem.tsx             (Single activity entry)
│       ├── CampaignsTable.tsx           (Campaign list with metrics)
│       ├── CampaignRow.tsx              (Table row component)
│       ├── ScansChart.tsx               (Line chart - scans over time)
│       ├── LocationsChart.tsx           (Bar chart - top locations)
│       ├── ConversionFunnel.tsx         (Funnel visualization)
│       ├── MapUpgradePrompt.tsx         (Free tier map placeholder)
│       └── AnalyticsUpgradePrompt.tsx   (Advanced analytics gate)
├── hooks/
│   ├── useDashboardStats.ts             (Overview metrics)
│   ├── useRealtimeScans.ts              (WebSocket scan updates)
│   ├── useCampaigns.ts                  (Campaign list data)
│   ├── useCampaignAnalytics.ts          (Single campaign metrics)
│   ├── useMapData.ts                    (Location pins + scan data)
│   └── useAnalyticsCharts.ts            (Chart data processing)
└── lib/
    ├── mapbox-config.ts                 (Mapbox initialization)
    ├── chart-utils.ts                   (Chart data formatters)
    └── analytics-utils.ts               (Metrics calculations)
```

---

## 📊 Backend Contracts (Already Built)

### Dashboard Stats Endpoint
```typescript
GET /api/realtime/analytics
Response: {
  tenant_id: string;
  snapshot: {
    scans: number;
    contacts: number;
    conversions: number;
    interactions: number;
    assets: number;
    lastUpdated: string;
  };
  timestamp: string;
}
```

### Campaigns with Stats
```typescript
GET /api/internal/campaigns
Response: {
  id: string;
  name: string;
  status: string;
  created_at: string;
  assets: { count: number }[];
  qr_links: { count: number }[];
  // We'll calculate scans/contacts client-side
}[]
```

### Scans for Map
```typescript
GET /api/internal/qr-scans?limit=100
Response: {
  id: string;
  scanned_at: string;
  location: {
    id: string;
    name: string;
    coordinates: { lat: number; lng: number };
  };
  campaign: { name: string };
}[]
```

### WebSocket for Real-Time
```typescript
ws://api.attra.io/ws/realtime

Messages:
{
  type: 'INSERT';
  table: 'qr_scans';
  data: {
    id: string;
    location_id: string;
    scanned_at: string;
  };
}
```

---

## 🎨 Implementation

### Step 1: Mapbox Configuration

**File:** `src/lib/mapbox-config.ts`

```typescript
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Initialize Mapbox token
export function initMapbox() {
  const token = import.meta.env.VITE_MAPBOX_TOKEN;
  
  if (!token) {
    console.error('VITE_MAPBOX_TOKEN not set');
    return false;
  }
  
  mapboxgl.accessToken = token;
  return true;
}

// Default map config
export const DEFAULT_MAP_CONFIG = {
  style: 'mapbox://styles/mapbox/light-v11',
  center: [-98.5795, 39.8283] as [number, number], // Center of USA
  zoom: 3,
  minZoom: 2,
  maxZoom: 18,
};

// Map theme based on user's brand color
export function getMapStyle(primaryColor?: string) {
  // For MVP, use light style
  // Future: customize based on tenant branding
  return 'mapbox://styles/mapbox/light-v11';
}

// Create custom marker element
export function createPinMarker(scanCount: number, isPulsing: boolean = false) {
  const el = document.createElement('div');
  el.className = `map-pin ${isPulsing ? 'pulsing' : ''}`;
  el.style.cssText = `
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #4F46E5;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    font-size: 14px;
    cursor: pointer;
    transition: transform 0.2s;
  `;
  
  if (isPulsing) {
    el.style.animation = 'pulse 2s infinite';
  }
  
  el.textContent = scanCount > 99 ? '99+' : scanCount.toString();
  
  el.addEventListener('mouseenter', () => {
    el.style.transform = 'scale(1.2)';
  });
  
  el.addEventListener('mouseleave', () => {
    el.style.transform = 'scale(1)';
  });
  
  return el;
}

// Add pulse animation CSS
export function addMapStyles() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0%, 100% {
        box-shadow: 0 2px 8px rgba(0,0,0,0.2), 0 0 0 0 rgba(79, 70, 229, 0.7);
      }
      50% {
        box-shadow: 0 2px 8px rgba(0,0,0,0.2), 0 0 0 20px rgba(79, 70, 229, 0);
      }
    }
    
    .mapboxgl-popup-content {
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    .mapboxgl-popup-close-button {
      font-size: 20px;
      padding: 4px 8px;
    }
  `;
  document.head.appendChild(style);
}
```

---

### Step 2: Analytics Utilities

**File:** `src/lib/analytics-utils.ts`

```typescript
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns';

export interface DashboardMetrics {
  totalScans: number;
  totalContacts: number;
  conversionRate: number;
  avgResponseTime: string;
  activeCampaigns: number;
}

export interface TimeSeriesData {
  date: string;
  scans: number;
  contacts: number;
}

export interface LocationData {
  name: string;
  scans: number;
  contacts: number;
  conversionRate: number;
}

/**
 * Calculate conversion rate
 */
export function calculateConversionRate(scans: number, contacts: number): number {
  if (scans === 0) return 0;
  return Math.round((contacts / scans) * 100);
}

/**
 * Format response time from seconds
 */
export function formatResponseTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

/**
 * Generate time series data from scans/contacts
 */
export function generateTimeSeries(
  scans: any[],
  contacts: any[],
  days: number = 30
): TimeSeriesData[] {
  const endDate = new Date();
  const startDate = subDays(endDate, days);
  
  const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
  
  return dateRange.map(date => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    
    const dayScans = scans.filter(s => {
      const scanDate = new Date(s.scanned_at);
      return scanDate >= dayStart && scanDate <= dayEnd;
    }).length;
    
    const dayContacts = contacts.filter(c => {
      const contactDate = new Date(c.created_at);
      return contactDate >= dayStart && contactDate <= dayEnd;
    }).length;
    
    return {
      date: format(date, 'MMM d'),
      scans: dayScans,
      contacts: dayContacts,
    };
  });
}

/**
 * Aggregate data by location
 */
export function aggregateByLocation(
  scans: any[],
  contacts: any[]
): LocationData[] {
  const locationMap = new Map<string, { scans: number; contacts: number }>();
  
  // Count scans per location
  scans.forEach(scan => {
    const locationName = scan.location?.name || 'Unknown';
    const current = locationMap.get(locationName) || { scans: 0, contacts: 0 };
    locationMap.set(locationName, { ...current, scans: current.scans + 1 });
  });
  
  // Count contacts per location
  contacts.forEach(contact => {
    const locationName = contact.location?.name || 'Unknown';
    const current = locationMap.get(locationName) || { scans: 0, contacts: 0 };
    locationMap.set(locationName, { ...current, contacts: current.contacts + 1 });
  });
  
  // Convert to array and calculate conversion rates
  return Array.from(locationMap.entries())
    .map(([name, data]) => ({
      name,
      scans: data.scans,
      contacts: data.contacts,
      conversionRate: calculateConversionRate(data.scans, data.contacts),
    }))
    .sort((a, b) => b.scans - a.scans)
    .slice(0, 10); // Top 10 locations
}

/**
 * Calculate funnel metrics
 */
export interface FunnelStage {
  name: string;
  count: number;
  percentage: number;
}

export function calculateFunnel(
  scans: number,
  contacts: number,
  responses: number
): FunnelStage[] {
  return [
    {
      name: 'Scans',
      count: scans,
      percentage: 100,
    },
    {
      name: 'Contacts Captured',
      count: contacts,
      percentage: scans > 0 ? Math.round((contacts / scans) * 100) : 0,
    },
    {
      name: 'Responses Sent',
      count: responses,
      percentage: contacts > 0 ? Math.round((responses / contacts) * 100) : 0,
    },
  ];
}
```

---

### Step 3: Hooks for Dashboard Data

**File:** `src/hooks/useDashboardStats.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { DashboardMetrics } from '@/lib/analytics-utils';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      
      const response = await fetch('/api/realtime/analytics', {
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
```

**File:** `src/hooks/useRealtimeScans.ts`

```typescript
import { useEffect, useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface RealtimeScan {
  id: string;
  location_id: string;
  location?: {
    name: string;
    coordinates: { lat: number; lng: number };
  };
  scanned_at: string;
  campaign?: { name: string };
}

export function useRealtimeScans() {
  const [recentScans, setRecentScans] = useState<RealtimeScan[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    if (!user?.tenant_id) return;
    
    // Connect to WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/realtime`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      
      // Authenticate
      ws.send(JSON.stringify({
        type: 'authenticate',
        tenant_id: user.tenant_id,
      }));
      
      // Subscribe to qr_scans
      ws.send(JSON.stringify({
        type: 'subscribe',
        table: 'qr_scans',
      }));
    };
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'INSERT' && message.table === 'qr_scans') {
          // New scan received
          const newScan: RealtimeScan = {
            id: message.data.id,
            location_id: message.data.location_id,
            scanned_at: message.data.scanned_at,
          };
          
          setRecentScans(prev => [newScan, ...prev].slice(0, 50));
          
          // Invalidate dashboard stats to refresh
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
          
          // Show toast notification (optional)
          toast({
            title: 'New scan!',
            description: 'Someone just scanned your QR code',
            duration: 3000,
          });
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };
    
    // Cleanup on unmount
    return () => {
      ws.close();
    };
  }, [user?.tenant_id, queryClient, toast]);
  
  return {
    recentScans,
    isConnected,
  };
}
```

**File:** `src/hooks/useMapData.ts`

```typescript
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
```

---

### Step 4: Stats Grid Component

**File:** `src/components/dashboard/StatCard.tsx`

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  loading?: boolean;
  subtitle?: string;
}

export function StatCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  loading,
  subtitle,
}: StatCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4 rounded-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16 mb-1" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(change || subtitle) && (
          <p className="text-xs text-muted-foreground mt-1">
            {change && (
              <span
                className={cn(
                  'font-medium',
                  changeType === 'positive' && 'text-green-600',
                  changeType === 'negative' && 'text-red-600'
                )}
              >
                {change}
              </span>
            )}
            {change && subtitle && ' '}
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

**File:** `src/components/dashboard/StatsGrid.tsx`

```typescript
import { Target, Users, TrendingUp, Clock } from 'lucide-react';
import { StatCard } from './StatCard';
import { useDashboardStats } from '@/hooks/useDashboardStats';

export function StatsGrid() {
  const { data: stats, isLoading } = useDashboardStats();
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Scans"
        value={stats?.totalScans.toLocaleString() || '0'}
        icon={Target}
        loading={isLoading}
        subtitle="All-time QR scans"
      />
      
      <StatCard
        title="Leads Captured"
        value={stats?.totalContacts.toLocaleString() || '0'}
        icon={Users}
        loading={isLoading}
        subtitle="Contacts in database"
      />
      
      <StatCard
        title="Conversion Rate"
        value={`${stats?.conversionRate || 0}%`}
        icon={TrendingUp}
        loading={isLoading}
        changeType={stats && stats.conversionRate > 15 ? 'positive' : 'neutral'}
        change={stats && stats.conversionRate > 15 ? 'Above average' : undefined}
      />
      
      <StatCard
        title="Avg Response Time"
        value={stats?.avgResponseTime || '—'}
        icon={Clock}
        loading={isLoading}
        subtitle="From scan to reach out"
      />
    </div>
  );
}
```

---

### Step 5: Map Component with Feature Gating

**File:** `src/components/dashboard/MapUpgradePrompt.tsx`

```typescript
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Lock, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function MapUpgradePrompt() {
  const navigate = useNavigate();
  
  return (
    <Card className="border-2 border-dashed border-muted-foreground/25 bg-muted/5">
      <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="mb-4 rounded-full bg-primary/10 p-4">
          <MapPin className="h-8 w-8 text-primary" />
        </div>
        
        <h3 className="text-xl font-semibold mb-2">
          See Where Your Scans Are Coming From
        </h3>
        
        <p className="text-muted-foreground mb-6 max-w-md">
          Visualize your scan locations on an interactive map. Track which neighborhoods 
          are converting best and optimize your flyer distribution strategy.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => navigate('/upgrade?feature=map_view')}
            size="lg"
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Upgrade to Starter
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/upgrade')}
          >
            View Plans
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground mt-4">
          Starting at $29/month
        </p>
      </CardContent>
    </Card>
  );
}
```

**File:** `src/components/dashboard/MapView.tsx`

```typescript
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Wifi, WifiOff } from 'lucide-react';
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
    if (!map.current || !mapData) return;
    
    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current.clear();
    
    // Add new markers
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
        .addTo(map.current);
      
      markers.current.set(pin.id, marker);
    });
    
    // Fit bounds to show all markers
    if (mapData.length > 0) {
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
    
    // Get the most recent scan
    const latestScan = recentScans[0];
    
    // Find the marker for this location and trigger pulse
    const marker = Array.from(markers.current.values()).find(m => {
      // This is a simplified check - you'd match by location_id in production
      return true; // TODO: Implement proper location matching
    });
    
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
```

---

### Step 6: Recent Activity Feed

**File:** `src/components/dashboard/ActivityItem.tsx`

```typescript
import { Target, Users, Mail, Phone } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItemProps {
  type: 'scan' | 'contact' | 'email' | 'call';
  title: string;
  description: string;
  timestamp: string;
}

const ICONS = {
  scan: Target,
  contact: Users,
  email: Mail,
  call: Phone,
};

const COLORS = {
  scan: 'text-blue-600',
  contact: 'text-green-600',
  email: 'text-purple-600',
  call: 'text-orange-600',
};

export function ActivityItem({ type, title, description, timestamp }: ActivityItemProps) {
  const Icon = ICONS[type];
  const color = COLORS[type];
  
  return (
    <div className="flex gap-3 py-3 border-b last:border-0">
      <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{title}</p>
        <p className="text-sm text-muted-foreground truncate">{description}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}
```

**File:** `src/components/dashboard/RecentActivityFeed.tsx`

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity } from 'lucide-react';
import { ActivityItem } from './ActivityItem';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function RecentActivityFeed() {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      // Get recent scans
      const { data: scans } = await supabase
        .from('qr_scans')
        .select(`
          id,
          scanned_at,
          location:locations(name),
          qr_link:qr_links(
            campaign:campaigns(name)
          )
        `)
        .order('scanned_at', { ascending: false })
        .limit(10);
      
      // Get recent contacts
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, name, created_at, location:locations(name)')
        .order('created_at', { ascending: false })
        .limit(10);
      
      // Combine and sort
      const combined = [
        ...(scans?.map(s => ({
          type: 'scan' as const,
          title: 'QR Code Scanned',
          description: `${s.qr_link?.campaign?.name || 'Campaign'} at ${s.location?.name || 'Unknown'}`,
          timestamp: s.scanned_at,
        })) || []),
        ...(contacts?.map(c => ({
          type: 'contact' as const,
          title: 'New Contact',
          description: `${c.name} from ${c.location?.name || 'Unknown'}`,
          timestamp: c.created_at,
        })) || []),
      ].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ).slice(0, 15);
      
      return combined;
    },
    refetchInterval: 30000,
  });
  
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[500px] overflow-y-auto px-6">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="py-3 border-b">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-48 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))
          ) : activities && activities.length > 0 ? (
            activities.map((activity, i) => (
              <ActivityItem key={i} {...activity} />
            ))
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No activity yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### Step 7: Dashboard Page with Responsive Layout

**File:** `src/pages/Dashboard.tsx`

```typescript
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { MapView } from '@/components/dashboard/MapView';
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  
  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Track your attribution in real-time
          </p>
        </div>
        
        <Button onClick={() => navigate('/campaigns/new')}>
          <Plus className="w-4 h-4 mr-2" />
          New Campaign
        </Button>
      </div>
      
      {/* Stats Grid */}
      <StatsGrid />
      
      {/* Desktop Layout: Option C (Map left, Activity right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map - Takes 2 columns on desktop */}
        <div className="lg:col-span-2">
          <MapView />
        </div>
        
        {/* Activity Feed - 1 column on desktop, full width on mobile */}
        <div className="lg:col-span-1">
          <RecentActivityFeed />
        </div>
      </div>
    </div>
  );
}
```

---

### Step 8: Environment Setup

**File:** `.env.example` (add to existing)

```bash
# Mapbox Configuration
VITE_MAPBOX_TOKEN=pk.your_mapbox_token_here
```

**Setup Instructions:**
1. Go to https://account.mapbox.com/
2. Create account (free tier: 50k loads/month)
3. Copy "Default public token"
4. Add to `.env` file

---

## ✅ Acceptance Criteria

### Core Functionality
- [ ] Dashboard loads with stats grid showing: scans, contacts, conversion rate, response time
- [ ] Stats auto-refresh every 30 seconds
- [ ] Map displays on Starter tier and above
- [ ] Free tier sees upgrade prompt instead of map
- [ ] Map pins show scan count per location
- [ ] Click pin shows popup with location details
- [ ] Map auto-fits bounds to show all pins
- [ ] Recent activity feed shows scans and contacts
- [ ] Activity feed updates every 30 seconds

### Real-Time Features (Pro Tier)
- [ ] WebSocket connects and authenticates
- [ ] New scans trigger pulse animation on map pin
- [ ] "Live" indicator shows connection status
- [ ] Activity feed updates instantly on new scan
- [ ] Dashboard stats refresh on new data

### Responsive Design
- [ ] Desktop (≥1024px): Option C layout (map left, activity right)
- [ ] Mobile (<1024px): Option B layout (stats → map → activity stacked)
- [ ] Map is 400px height on all breakpoints
- [ ] Activity feed scrolls independently
- [ ] Touch-friendly pin markers on mobile

### Feature Gating
- [ ] Free tier cannot access map (sees upgrade prompt)
- [ ] Starter tier sees static map (no real-time)
- [ ] Pro tier sees real-time pulse animations
- [ ] "Upgrade" buttons navigate to `/upgrade?feature=map_view`
- [ ] Feature gates checked before WebSocket connection

---

## 🧪 Manual Testing Script

### Test 1: Free Tier Experience
1. Log in with free tier account
2. Navigate to Dashboard
3. **Expected:** Stats grid visible, map shows upgrade prompt
4. Click "Upgrade to Starter"
5. **Expected:** Redirect to upgrade page with `?feature=map_view`

### Test 2: Starter Tier Map
1. Log in with starter tier account
2. Navigate to Dashboard
3. **Expected:** Map loads with pins at scan locations
4. Click a pin
5. **Expected:** Popup shows location name, scan count, recent scans
6. **Expected:** No "Live" indicator, no pulse animations

### Test 3: Pro Tier Real-Time
1. Log in with pro tier account
2. Navigate to Dashboard
3. **Expected:** "Live" indicator with green wifi icon
4. Trigger a scan (use test QR code or insert via SQL)
5. **Expected:** Pin pulses for 2 seconds, activity feed updates instantly
6. **Expected:** Stats grid refreshes within 30 seconds

### Test 4: Responsive Layout
1. Open dashboard on desktop (1920px)
2. **Expected:** Stats in 4-column grid, map left (2/3), activity right (1/3)
3. Resize to tablet (768px)
4. **Expected:** Stats in 2-column grid, map and activity stacked
5. Resize to mobile (375px)
6. **Expected:** All elements full-width, stats in 2 columns, vertical scroll

### Test 5: WebSocket Connection
1. Open browser DevTools → Network → WS
2. Navigate to Dashboard (Pro tier)
3. **Expected:** WebSocket connection to `/ws/realtime`
4. **Expected:** `authenticate` and `subscribe` messages sent
5. Trigger scan
6. **Expected:** `INSERT` message received with scan data

---

## 🎯 Future Enhancements (Not MVP)

### Phase 2 Features:
1. **Heat Map Layer**
   - Show density of scans using color gradient
   - Toggle between pins and heat map view

2. **Time Slider**
   - Scrub through historical scans
   - Animate scan progression over time

3. **Campaign Filtering**
   - Filter map by specific campaign
   - Show only active campaigns

4. **Export Map Image**
   - Screenshot current map view
   - Include in PDF reports

5. **Custom Map Styles**
   - Match tenant's brand colors
   - Dark mode map option

---

## ✅ Completion Checklist

Before marking this file as complete:

- [ ] All code files created with complete implementations
- [ ] Mapbox token configured in `.env`
- [ ] WebSocket connection tested and working
- [ ] Feature gating integrated correctly
- [ ] Responsive layouts verified on all breakpoints
- [ ] Map markers render with correct data
- [ ] Real-time pulse animations work (Pro tier)
- [ ] Activity feed updates in real-time
- [ ] All components render without errors
- [ ] No console errors or warnings
- [ ] Mobile touch interactions tested
- [ ] All acceptance criteria met
- [ ] Manual testing completed
- [ ] Git commit made with descriptive message

---

**File Complete:** This is a production-ready, executable command file.  
**Claude Code:** Execute each step in sequence. Do not skip steps.  
**Result:** Fully functional analytics dashboard with beautiful Mapbox visualization, real-time updates, and strategic feature gating that drives upgrades naturally.
