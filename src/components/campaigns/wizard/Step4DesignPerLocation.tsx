import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Sparkles, Palette } from 'lucide-react';
import { BackgroundLibrary } from '@/components/campaigns/BackgroundLibrary';
import { useBackgroundGeneration } from '@/hooks/useBackgroundGeneration';
import { useAuth } from '@/hooks/useAuth';
import { locationApi } from '@/lib/location-api';
import type { LayoutType, CampaignCopy, LocationAsset } from '@/types/campaign';
import type { Background } from '@/types/background';

const LAYOUTS: Array<{
  value: LayoutType;
  label: string;
  description: string;
}> = [
  {
    value: 'classic',
    label: 'Classic',
    description: 'Traditional layout with elegant styling'
  },
  {
    value: 'modern',
    label: 'Modern',
    description: 'Clean, contemporary design with bold typography'
  },
  {
    value: 'minimal',
    label: 'Minimal',
    description: 'Simple and understated with maximum impact'
  }
];

interface Step4DesignPerLocationProps {
  selectedLocationIds: string[];
  destinationUrl: string;
  onDestinationUrlChange: (url: string) => void;
  locationAssets: LocationAsset[];
  onLocationAssetsChange: (assets: LocationAsset[]) => void;
}

export function Step4DesignPerLocation({
  selectedLocationIds,
  destinationUrl,
  onDestinationUrlChange,
  locationAssets,
  onLocationAssetsChange
}: Step4DesignPerLocationProps) {
  const { tenant } = useAuth();
  const [activeTab, setActiveTab] = useState(selectedLocationIds[0] || '');
  const [designModes, setDesignModes] = useState<Record<string, 'ai' | 'classic'>>({});
  const [showGenerationModal, setShowGenerationModal] = useState<string | null>(null);

  const { generate, isGenerating } = useBackgroundGeneration({
    tenantId: tenant?.id || '',
    onSuccess: (background: Background) => {
      if (showGenerationModal) {
        updateLocationAsset(showGenerationModal, { background_id: background.id });
        setDesignModes({ ...designModes, [showGenerationModal]: 'ai' });
        setShowGenerationModal(null);
      }
    },
  });

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

  const updateLocationAsset = (locationId: string, updates: Partial<LocationAsset>) => {
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

  const handleSelectBackground = (locationId: string, backgroundId: string) => {
    updateLocationAsset(locationId, { background_id: backgroundId });
    setDesignModes({ ...designModes, [locationId]: 'ai' });
  };

  const handleGenerateNew = (locationId: string) => {
    generate(undefined);
    setShowGenerationModal(locationId);
  };

  const handleTabChange = (locationId: string, value: string) => {
    const mode = value as 'ai' | 'classic';
    setDesignModes({ ...designModes, [locationId]: mode });

    if (mode === 'classic') {
      // Clear background selection and ensure layout is set
      const asset = locationAssets.find(a => a.location_id === locationId);
      updateLocationAsset(locationId, {
        background_id: undefined,
        layout: asset?.layout || 'modern'
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
            background_id: undefined,
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

              {/* Background Selection: AI vs Classic Templates */}
              <Card>
                <CardHeader>
                  <CardTitle>Choose Background Style</CardTitle>
                  <CardDescription>Use AI-generated backgrounds or classic HTML templates for {location.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs
                    value={designModes[location.id] || (asset.background_id ? 'ai' : 'classic')}
                    onValueChange={(value) => handleTabChange(location.id, value)}
                  >
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                      <TabsTrigger value="ai" className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        AI Backgrounds
                      </TabsTrigger>
                      <TabsTrigger value="classic" className="flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        Classic Templates
                      </TabsTrigger>
                    </TabsList>

                    {/* AI Backgrounds Tab */}
                    <TabsContent value="ai" className="space-y-4">
                      {isGenerating && showGenerationModal === location.id && (
                        <Card className="border-blue-200 bg-blue-50/50">
                          <CardContent className="p-4 flex items-center gap-3">
                            <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
                            <div>
                              <p className="font-medium">Generating AI background...</p>
                              <p className="text-sm text-muted-foreground">This may take 5-10 seconds</p>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      <BackgroundLibrary
                        selectedId={asset.background_id}
                        onSelect={(id) => handleSelectBackground(location.id, id)}
                        onGenerateNew={() => handleGenerateNew(location.id)}
                        previewCopy={asset.copy}
                        compact={true}
                      />
                    </TabsContent>

                    {/* Classic Templates Tab */}
                    <TabsContent value="classic" className="space-y-4">
                      <RadioGroup
                        value={asset.layout || 'modern'}
                        onValueChange={(value) => updateLocationAsset(location.id, { layout: value as LayoutType })}
                      >
                        <div className="grid gap-4">
                          {LAYOUTS.map((layoutOption) => {
                            const isSelected = asset.layout === layoutOption.value;

                            return (
                              <Card
                                key={layoutOption.value}
                                className={`cursor-pointer transition-all hover:border-primary ${
                                  isSelected ? 'border-primary ring-2 ring-primary ring-offset-2' : ''
                                }`}
                                onClick={() => updateLocationAsset(location.id, { layout: layoutOption.value })}
                              >
                                <CardHeader className="flex flex-row items-center space-x-4 pb-2">
                                  <RadioGroupItem value={layoutOption.value} id={`${location.id}-${layoutOption.value}`} />
                                  <div className="flex-1">
                                    <Label htmlFor={`${location.id}-${layoutOption.value}`} className="cursor-pointer">
                                      <CardTitle className="text-base">{layoutOption.label}</CardTitle>
                                    </Label>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <CardDescription>{layoutOption.description}</CardDescription>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </RadioGroup>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
