import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin } from 'lucide-react';
import { locationApi } from '@/lib/location-api';
import type { LayoutType, CampaignCopy, LocationCopy } from '@/types/campaign';

const LAYOUTS: Array<{
  value: LayoutType;
  label: string;
}> = [
  { value: 'classic', label: 'Classic' },
  { value: 'modern', label: 'Modern' },
  { value: 'minimal', label: 'Minimal' }
];

interface Step4DesignPerLocationProps {
  selectedLocationIds: string[];
  destinationUrl: string;
  onDestinationUrlChange: (url: string) => void;
  locationAssets: LocationCopy[];
  onLocationAssetsChange: (assets: LocationCopy[]) => void;
}

export function Step4DesignPerLocation({
  selectedLocationIds,
  destinationUrl,
  onDestinationUrlChange,
  locationAssets,
  onLocationAssetsChange
}: Step4DesignPerLocationProps) {
  const [activeTab, setActiveTab] = useState(selectedLocationIds[0] || '');

  const { data: response } = useQuery({
    queryKey: ['locations', selectedLocationIds],
    queryFn: locationApi.list,
    enabled: selectedLocationIds.length > 0
  });

  // Extract locations from response
  const allLocations = (response as any)?.locations || (Array.isArray(response) ? response : []);
  const locations = allLocations.filter((loc: any) => selectedLocationIds.includes(loc.id));

  // Initialize location assets if empty (CRITICAL FIX: in useEffect to avoid render loops)
  useEffect(() => {
    if (locationAssets.length === 0 && selectedLocationIds.length > 0) {
      onLocationAssetsChange(
        selectedLocationIds.map(id => ({
          location_id: id,
          layout: 'modern' as LayoutType,
          copy: { headline: '', subheadline: '', cta: '' }
        }))
      );
    }
  }, [selectedLocationIds.length, locationAssets.length]);

  // Update active tab if it's no longer in selected locations
  useEffect(() => {
    if (activeTab && !selectedLocationIds.includes(activeTab)) {
      setActiveTab(selectedLocationIds[0] || '');
    }
  }, [selectedLocationIds, activeTab]);

  const updateLocationAsset = (locationId: string, updates: Partial<LocationCopy>) => {
    onLocationAssetsChange(
      locationAssets.map(asset =>
        asset.location_id === locationId
          ? { ...asset, ...updates }
          : asset
      )
    );
  };

  const updateLocationCopy = (locationId: string, copyUpdates: Partial<CampaignCopy>) => {
    const asset = locationAssets.find(a => a.location_id === locationId);
    if (asset) {
      updateLocationAsset(locationId, {
        copy: { ...asset.copy, ...copyUpdates }
      });
    }
  };

  if (!locations || locations.length === 0) {
    return <div>Loading locations...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Design Per Location</h2>
        <p className="text-muted-foreground">
          Customize the copy and layout for each location
        </p>
      </div>

      {/* Shared Destination URL */}
      <Card>
        <CardHeader>
          <CardTitle>Destination URL</CardTitle>
          <CardDescription>
            All QR codes will point here (UTM parameters added automatically)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            type="url"
            placeholder="https://example.com/promo"
            value={destinationUrl}
            onChange={(e) => onDestinationUrlChange(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Per-Location Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${locations.length}, 1fr)` }}>
          {locations.map((location: any) => (
            <TabsTrigger key={location.id} value={location.id} className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">{location.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {locations.map((location: any) => {
          const asset = locationAssets.find(a => a.location_id === location.id) || {
            location_id: location.id,
            layout: 'modern' as LayoutType,
            copy: { headline: '', subheadline: '', cta: '' }
          };

          return (
            <TabsContent key={location.id} value={location.id} className="space-y-6 mt-6">
              <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                <CardContent className="p-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">{location.name}</p>
                    {location.address && (
                      <p className="text-sm text-muted-foreground">
                        {location.address}{location.city && `, ${location.city}`}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Copy Fields */}
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Copy</CardTitle>
                  <CardDescription>Customize for {location.name}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>
                      Headline <span className="text-xs text-muted-foreground">(max 60 characters)</span>
                    </Label>
                    <Input
                      placeholder="Free Walk Guarantee"
                      value={asset.copy.headline}
                      onChange={(e) => updateLocationCopy(location.id, { headline: e.target.value })}
                      maxLength={60}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {asset.copy.headline?.length || 0} / 60
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Subheadline <span className="text-xs text-muted-foreground">(max 120 characters)</span>
                    </Label>
                    <Textarea
                      placeholder="We respond in 3 hours or your walk is free"
                      value={asset.copy.subheadline}
                      onChange={(e) => updateLocationCopy(location.id, { subheadline: e.target.value })}
                      maxLength={120}
                      rows={2}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {asset.copy.subheadline?.length || 0} / 120
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Call to Action <span className="text-xs text-muted-foreground">(max 40 characters)</span>
                    </Label>
                    <Input
                      placeholder="Text WALK to 555-1234"
                      value={asset.copy.cta}
                      onChange={(e) => updateLocationCopy(location.id, { cta: e.target.value })}
                      maxLength={40}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {asset.copy.cta?.length || 0} / 40
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Layout Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Layout</CardTitle>
                  <CardDescription>Choose design style for {location.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={asset.layout}
                    onValueChange={(value) => updateLocationAsset(location.id, { layout: value as LayoutType })}
                  >
                    <div className="grid gap-3">
                      {LAYOUTS.map((layoutOption) => (
                        <div key={layoutOption.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={layoutOption.value} id={`${location.id}-${layoutOption.value}`} />
                          <Label htmlFor={`${location.id}-${layoutOption.value}`} className="cursor-pointer">
                            {layoutOption.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
