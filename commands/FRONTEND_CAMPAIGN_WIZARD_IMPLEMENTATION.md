# FRONTEND_CAMPAIGN_WIZARD_IMPLEMENTATION.md

## 🎯 Goal

Build a simplified campaign creation wizard that matches the new backend architecture. The wizard collects campaign goal, locations, asset type, and copy (shared or per-location) BEFORE generating assets atomically via a single API call.

**Priority:** CRITICAL - Matches backend fix (fix_campaign_asset_generation_flow.md)
**Estimated Time:** 3-4 hours
**Dependencies:** Backend fix must be deployed first

---

## 🎨 New Wizard Flow

```
Step 1: Campaign Goal
  └─ What's the purpose? (new_clients, retention, event_promo, etc.)

Step 2: Select Locations (Multi-select)
  └─ Which locations will use this campaign?

Step 3: Select Asset Type
  └─ What are you creating? (Flyer, Table Tent, Door Hanger, etc.)

Step 3.5: Customization Toggle
  └─ ☐ Customize copy for each location?
      ├─ NO → Design once (shared copy for all locations)
      └─ YES → Design separately for each location

Steps 4-6: Design
  ├─ IF shared mode:
  │   └─ Single form: Destination URL, Headline, Subheadline, CTA, Layout
  │
  └─ IF per-location mode:
      └─ Form repeated for each location with same fields

Step 7: Review & Generate
  └─ Summary → Single API call → Redirect to campaign page
```

**Key Differences from Old Version:**
- ❌ Remove: Component library and reuse system
- ❌ Remove: Multiple API calls
- ❌ Remove: Complex state management
- ✅ Add: Simple copy fields (headline, subheadline, cta)
- ✅ Add: Destination URL input
- ✅ Add: Per-location customization toggle
- ✅ Simplify: Single atomic API call to `/generate-flyer`

---

## 📋 Step-by-Step Implementation

### Step 1: Update Campaign Types

**File:** `src/types/campaign.ts`

```typescript
export interface Campaign {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  goal: string;
  asset_type?: string;
  copy?: CampaignCopy;
  status: 'draft' | 'active' | 'paused' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface CampaignCopy {
  headline: string;
  subheadline: string;
  cta: string;
}

export type CampaignGoal = 
  | 'new_clients' 
  | 'retention' 
  | 'event_promo' 
  | 'seasonal'
  | 'awareness';

export type AssetType = 
  | 'flyer' 
  | 'door_hanger' 
  | 'table_tent' 
  | 'menu_board'
  | 'business_card';

export type LayoutType = 'classic' | 'modern' | 'minimal';

export interface LocationCopy {
  location_id: string;
  layout: LayoutType;
  copy: CampaignCopy;
}

export interface WizardData {
  // Step 1
  goal?: CampaignGoal;
  
  // Step 2
  selectedLocations: string[];
  
  // Step 3
  assetType?: AssetType;
  
  // Step 3.5
  customizePerLocation: boolean;
  
  // Steps 4-6 (Shared mode)
  destinationUrl?: string;
  layout?: LayoutType;
  copy?: CampaignCopy;
  
  // Steps 4-6 (Per-location mode)
  locationAssets?: LocationCopy[];
}

export interface GenerateAssetsRequest {
  asset_type: AssetType;
  base_url: string;
  
  // Shared mode
  location_ids?: string[];
  layout?: LayoutType;
  copy?: CampaignCopy;
  
  // Per-location mode
  assets?: Array<{
    location_id: string;
    layout: LayoutType;
    copy: CampaignCopy;
  }>;
}
```

---

### Step 2: Create Campaign API Client

**File:** `src/lib/campaign-api.ts`

```typescript
import { supabase } from './supabase';
import type { Campaign, GenerateAssetsRequest } from '@/types/campaign';

export const campaignAPI = {
  /**
   * Create a new campaign
   */
  async create(data: {
    name: string;
    goal: string;
    description?: string;
  }): Promise<Campaign> {
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/internal/campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Failed to create campaign');
    }
    
    return response.json();
  },

  /**
   * Generate assets for campaign (bulk operation)
   */
  async generateAssets(
    campaignId: string, 
    request: GenerateAssetsRequest
  ): Promise<{
    message: string;
    campaign_id: string;
    assets_created: number;
    qr_links_created: number;
    jobs_enqueued: number;
    assets: any[];
    qr_links: any[];
    job_ids: string[];
  }> {
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/internal/campaigns/${campaignId}/generate-flyer`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(request)
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate assets');
    }
    
    return response.json();
  },

  /**
   * Get campaign assets
   */
  async getAssets(campaignId: string): Promise<any[]> {
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/internal/campaigns/${campaignId}/assets`,
      {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch assets');
    }
    
    const data = await response.json();
    return data.assets || [];
  },

  /**
   * Get campaign details
   */
  async get(campaignId: string): Promise<Campaign> {
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/internal/campaigns/${campaignId}`,
      {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch campaign');
    }
    
    return response.json();
  }
};
```

---

### Step 3: Create Wizard State Hook

**File:** `src/hooks/useCampaignWizard.ts`

```typescript
import { useState } from 'react';
import type { WizardData, CampaignGoal, AssetType, LayoutType, CampaignCopy } from '@/types/campaign';

export function useCampaignWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<WizardData>({
    selectedLocations: [],
    customizePerLocation: false,
    locationAssets: []
  });

  const updateData = (updates: Partial<WizardData>) => {
    setWizardData(prev => ({ ...prev, ...updates }));
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1: // Goal
        return !!wizardData.goal;
      
      case 2: // Locations
        return wizardData.selectedLocations.length > 0;
      
      case 3: // Asset Type + Customize Toggle
        return !!wizardData.assetType;
      
      case 4: // Design (depends on mode)
        if (!wizardData.customizePerLocation) {
          // Shared mode: need URL, copy, and layout
          return !!(
            wizardData.destinationUrl &&
            wizardData.copy?.headline &&
            wizardData.copy?.subheadline &&
            wizardData.copy?.cta &&
            wizardData.layout
          );
        } else {
          // Per-location mode: need all locations configured
          return (
            wizardData.locationAssets?.length === wizardData.selectedLocations.length &&
            wizardData.locationAssets.every(asset =>
              asset.copy?.headline &&
              asset.copy?.subheadline &&
              asset.copy?.cta &&
              asset.layout
            )
          );
        }
      
      case 5: // Review
        return true;
      
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (canProceed()) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const reset = () => {
    setCurrentStep(1);
    setWizardData({
      selectedLocations: [],
      customizePerLocation: false,
      locationAssets: []
    });
  };

  return {
    currentStep,
    wizardData,
    updateData,
    canProceed: canProceed(),
    nextStep,
    prevStep,
    reset
  };
}
```

---

### Step 4: Create Step 1 - Goal Selection

**File:** `src/components/campaigns/wizard/Step1Goal.tsx`

```typescript
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import type { CampaignGoal } from '@/types/campaign';
import { Target, Users, Calendar, Megaphone, TrendingUp } from 'lucide-react';

const GOALS: Array<{
  value: CampaignGoal;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    value: 'new_clients',
    label: 'New Clients',
    description: 'Attract new customers to your business',
    icon: Target
  },
  {
    value: 'retention',
    label: 'Retention',
    description: 'Re-engage existing customers',
    icon: Users
  },
  {
    value: 'event_promo',
    label: 'Event Promotion',
    description: 'Promote an upcoming event or special offer',
    icon: Calendar
  },
  {
    value: 'seasonal',
    label: 'Seasonal Campaign',
    description: 'Holiday or seasonal marketing push',
    icon: TrendingUp
  },
  {
    value: 'awareness',
    label: 'Brand Awareness',
    description: 'Increase visibility and recognition',
    icon: Megaphone
  }
];

interface Step1GoalProps {
  value?: CampaignGoal;
  onChange: (goal: CampaignGoal) => void;
}

export function Step1Goal({ value, onChange }: Step1GoalProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">What's your campaign goal?</h2>
        <p className="text-muted-foreground">
          Choose the primary objective for this campaign
        </p>
      </div>

      <RadioGroup value={value} onValueChange={onChange}>
        <div className="grid gap-4">
          {GOALS.map((goal) => {
            const Icon = goal.icon;
            const isSelected = value === goal.value;

            return (
              <Card
                key={goal.value}
                className={`cursor-pointer transition-all hover:border-primary ${
                  isSelected ? 'border-primary ring-2 ring-primary ring-offset-2' : ''
                }`}
                onClick={() => onChange(goal.value)}
              >
                <CardHeader className="flex flex-row items-center space-x-4 pb-2">
                  <RadioGroupItem value={goal.value} id={goal.value} />
                  <Icon className="w-6 h-6 text-primary" />
                  <div className="flex-1">
                    <Label htmlFor={goal.value} className="cursor-pointer">
                      <CardTitle className="text-lg">{goal.label}</CardTitle>
                    </Label>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{goal.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </RadioGroup>
    </div>
  );
}
```

---

### Step 5: Create Step 2 - Location Selection

**File:** `src/components/campaigns/wizard/Step2Locations.tsx`

```typescript
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Location {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
}

interface Step2LocationsProps {
  value: string[];
  onChange: (locationIds: string[]) => void;
}

export function Step2Locations({ value, onChange }: Step2LocationsProps) {
  const { data: locations, isLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const tenantId = session?.user?.app_metadata?.tenant_id;
      
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('name');
      
      if (error) throw error;
      return data as Location[];
    }
  });

  const toggleLocation = (locationId: string) => {
    if (value.includes(locationId)) {
      onChange(value.filter(id => id !== locationId));
    } else {
      onChange([...value, locationId]);
    }
  };

  const selectAll = () => {
    if (locations) {
      onChange(locations.map(loc => loc.id));
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!locations || locations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Locations Found</CardTitle>
          <CardDescription>
            You need to create at least one location before creating a campaign.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Select Locations</h2>
          <p className="text-muted-foreground">
            Choose which locations will use this campaign
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={selectAll}>
            Select All
          </Button>
          <Button variant="outline" size="sm" onClick={clearAll}>
            Clear All
          </Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground mb-4">
        {value.length} of {locations.length} selected
      </div>

      <div className="grid gap-3">
        {locations.map((location) => {
          const isSelected = value.includes(location.id);

          return (
            <Card
              key={location.id}
              className={`cursor-pointer transition-all hover:border-primary ${
                isSelected ? 'border-primary bg-primary/5' : ''
              }`}
              onClick={() => toggleLocation(location.id)}
            >
              <CardContent className="flex items-center space-x-4 p-4">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleLocation(location.id)}
                />
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <Label className="cursor-pointer font-medium">
                    {location.name}
                  </Label>
                  {location.address && (
                    <p className="text-sm text-muted-foreground">
                      {location.address}
                      {location.city && `, ${location.city}`}
                      {location.state && `, ${location.state}`}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
```

---

### Step 6: Create Step 3 - Asset Type & Customize Toggle

**File:** `src/components/campaigns/wizard/Step3AssetType.tsx`

```typescript
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import type { AssetType } from '@/types/campaign';
import { FileText, Home, UtensilsCrossed, CreditCard, Signpost } from 'lucide-react';

const ASSET_TYPES: Array<{
  value: AssetType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    value: 'flyer',
    label: 'Flyer',
    description: 'Standard 8.5x11 promotional flyer',
    icon: FileText
  },
  {
    value: 'door_hanger',
    label: 'Door Hanger',
    description: 'Door-to-door marketing material',
    icon: Home
  },
  {
    value: 'table_tent',
    label: 'Table Tent',
    description: 'Folded tabletop display',
    icon: UtensilsCrossed
  },
  {
    value: 'business_card',
    label: 'Business Card',
    description: 'Standard business card format',
    icon: CreditCard
  },
  {
    value: 'menu_board',
    label: 'Menu Board',
    description: 'Restaurant menu or price list',
    icon: Signpost
  }
];

interface Step3AssetTypeProps {
  assetType?: AssetType;
  onAssetTypeChange: (type: AssetType) => void;
  customizePerLocation: boolean;
  onCustomizeChange: (customize: boolean) => void;
}

export function Step3AssetType({
  assetType,
  onAssetTypeChange,
  customizePerLocation,
  onCustomizeChange
}: Step3AssetTypeProps) {
  return (
    <div className="space-y-8">
      {/* Asset Type Selection */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Choose Asset Type</h2>
          <p className="text-muted-foreground">
            What type of marketing material are you creating?
          </p>
        </div>

        <RadioGroup value={assetType} onValueChange={onAssetTypeChange}>
          <div className="grid gap-4">
            {ASSET_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = assetType === type.value;

              return (
                <Card
                  key={type.value}
                  className={`cursor-pointer transition-all hover:border-primary ${
                    isSelected ? 'border-primary ring-2 ring-primary ring-offset-2' : ''
                  }`}
                  onClick={() => onAssetTypeChange(type.value)}
                >
                  <CardHeader className="flex flex-row items-center space-x-4 pb-2">
                    <RadioGroupItem value={type.value} id={type.value} />
                    <Icon className="w-6 h-6 text-primary" />
                    <div className="flex-1">
                      <Label htmlFor={type.value} className="cursor-pointer">
                        <CardTitle className="text-lg">{type.label}</CardTitle>
                      </Label>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{type.description}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </RadioGroup>
      </div>

      <Separator />

      {/* Customization Toggle */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold mb-2">Customization Options</h3>
          <p className="text-muted-foreground text-sm">
            Do you want the same copy for all locations, or customize for each?
          </p>
        </div>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div className="space-y-1">
              <Label htmlFor="customize-toggle" className="text-base font-medium">
                Customize copy for each location
              </Label>
              <p className="text-sm text-muted-foreground">
                {customizePerLocation
                  ? 'You\'ll design separately for each location'
                  : 'Same headline, subheadline, and CTA for all locations'}
              </p>
            </div>
            <Switch
              id="customize-toggle"
              checked={customizePerLocation}
              onCheckedChange={onCustomizeChange}
            />
          </CardContent>
        </Card>

        {customizePerLocation && (
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
            <CardContent className="p-4">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                💡 <strong>Per-location mode:</strong> You'll be able to customize the headline, 
                subheadline, CTA, and layout for each selected location individually.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
```

---

### Step 7: Create Step 4 - Design (Shared Mode)

**File:** `src/components/campaigns/wizard/Step4DesignShared.tsx`

```typescript
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { LayoutType, CampaignCopy } from '@/types/campaign';

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

interface Step4DesignSharedProps {
  destinationUrl: string;
  onDestinationUrlChange: (url: string) => void;
  copy: CampaignCopy;
  onCopyChange: (copy: CampaignCopy) => void;
  layout: LayoutType;
  onLayoutChange: (layout: LayoutType) => void;
}

export function Step4DesignShared({
  destinationUrl,
  onDestinationUrlChange,
  copy,
  onCopyChange,
  layout,
  onLayoutChange
}: Step4DesignSharedProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Design Your Campaign</h2>
        <p className="text-muted-foreground">
          This copy will be used for all selected locations
        </p>
      </div>

      {/* Destination URL */}
      <Card>
        <CardHeader>
          <CardTitle>Destination URL</CardTitle>
          <CardDescription>
            Where should QR codes redirect to?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="destination-url">URL</Label>
            <Input
              id="destination-url"
              type="url"
              placeholder="https://example.com/promo"
              value={destinationUrl}
              onChange={(e) => onDestinationUrlChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              UTM parameters will be added automatically for tracking
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Copy Fields */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Copy</CardTitle>
          <CardDescription>
            Write the text that will appear on your {layout || 'flyer'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Headline */}
          <div className="space-y-2">
            <Label htmlFor="headline">
              Headline <span className="text-xs text-muted-foreground">(max 60 characters)</span>
            </Label>
            <Input
              id="headline"
              placeholder="Free Walk Guarantee"
              value={copy.headline}
              onChange={(e) => onCopyChange({ ...copy, headline: e.target.value })}
              maxLength={60}
            />
            <p className="text-xs text-muted-foreground text-right">
              {copy.headline?.length || 0} / 60
            </p>
          </div>

          {/* Subheadline */}
          <div className="space-y-2">
            <Label htmlFor="subheadline">
              Subheadline <span className="text-xs text-muted-foreground">(max 120 characters)</span>
            </Label>
            <Textarea
              id="subheadline"
              placeholder="We respond in 3 hours or your walk is free"
              value={copy.subheadline}
              onChange={(e) => onCopyChange({ ...copy, subheadline: e.target.value })}
              maxLength={120}
              rows={2}
            />
            <p className="text-xs text-muted-foreground text-right">
              {copy.subheadline?.length || 0} / 120
            </p>
          </div>

          {/* CTA */}
          <div className="space-y-2">
            <Label htmlFor="cta">
              Call to Action <span className="text-xs text-muted-foreground">(max 40 characters)</span>
            </Label>
            <Input
              id="cta"
              placeholder="Text WALK to 555-1234"
              value={copy.cta}
              onChange={(e) => onCopyChange({ ...copy, cta: e.target.value })}
              maxLength={40}
            />
            <p className="text-xs text-muted-foreground text-right">
              {copy.cta?.length || 0} / 40
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Layout Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Choose Layout</CardTitle>
          <CardDescription>
            Select a design style for your flyer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={layout} onValueChange={onLayoutChange}>
            <div className="grid gap-4">
              {LAYOUTS.map((layoutOption) => {
                const isSelected = layout === layoutOption.value;

                return (
                  <Card
                    key={layoutOption.value}
                    className={`cursor-pointer transition-all hover:border-primary ${
                      isSelected ? 'border-primary ring-2 ring-primary ring-offset-2' : ''
                    }`}
                    onClick={() => onLayoutChange(layoutOption.value)}
                  >
                    <CardHeader className="flex flex-row items-center space-x-4 pb-2">
                      <RadioGroupItem value={layoutOption.value} id={layoutOption.value} />
                      <div className="flex-1">
                        <Label htmlFor={layoutOption.value} className="cursor-pointer">
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
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### Step 8: Create Step 4 - Design (Per-Location Mode)

**File:** `src/components/campaigns/wizard/Step4DesignPerLocation.tsx`

```typescript
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
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

  const { data: locations } = useQuery({
    queryKey: ['locations', selectedLocationIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name, address, city, state')
        .in('id', selectedLocationIds);
      
      if (error) throw error;
      return data;
    },
    enabled: selectedLocationIds.length > 0
  });

  // Initialize location assets if empty
  if (locationAssets.length === 0 && selectedLocationIds.length > 0) {
    onLocationAssetsChange(
      selectedLocationIds.map(id => ({
        location_id: id,
        layout: 'modern',
        copy: { headline: '', subheadline: '', cta: '' }
      }))
    );
  }

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
          {locations.map((location) => (
            <TabsTrigger key={location.id} value={location.id} className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">{location.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {locations.map((location) => {
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
```

---

### Step 9: Create Step 5 - Review & Generate

**File:** `src/components/campaigns/wizard/Step5Review.tsx`

```typescript
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { MapPin, FileText, Target } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { WizardData } from '@/types/campaign';

interface Step5ReviewProps {
  data: WizardData;
}

export function Step5Review({ data }: Step5ReviewProps) {
  const { data: locations } = useQuery({
    queryKey: ['locations', data.selectedLocations],
    queryFn: async () => {
      const { data: locs, error } = await supabase
        .from('locations')
        .select('id, name')
        .in('id', data.selectedLocations);
      
      if (error) throw error;
      return locs;
    },
    enabled: data.selectedLocations.length > 0
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Review & Generate</h2>
        <p className="text-muted-foreground">
          Review your campaign details before generating assets
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Campaign Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Goal */}
          <div>
            <p className="text-sm text-muted-foreground">Goal</p>
            <p className="font-medium capitalize">{data.goal?.replace('_', ' ')}</p>
          </div>

          <Separator />

          {/* Asset Type */}
          <div>
            <p className="text-sm text-muted-foreground">Asset Type</p>
            <p className="font-medium capitalize">{data.assetType?.replace('_', ' ')}</p>
          </div>

          <Separator />

          {/* Locations */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Locations ({data.selectedLocations.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {locations?.map((location) => (
                <Badge key={location.id} variant="secondary" className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {location.name}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Destination URL */}
          <div>
            <p className="text-sm text-muted-foreground">Destination URL</p>
            <p className="font-medium text-sm break-all">{data.destinationUrl}</p>
          </div>

          <Separator />

          {/* Customization Mode */}
          <div>
            <p className="text-sm text-muted-foreground">Copy Customization</p>
            <p className="font-medium">
              {data.customizePerLocation ? 'Per-location (customized for each)' : 'Shared (same for all)'}
            </p>
          </div>

          {/* Show copy preview if shared mode */}
          {!data.customizePerLocation && data.copy && (
            <>
              <Separator />
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium">Copy Preview:</p>
                <p className="text-lg font-bold">{data.copy.headline}</p>
                <p className="text-sm text-muted-foreground">{data.copy.subheadline}</p>
                <p className="text-sm font-medium text-primary">{data.copy.cta}</p>
              </div>
            </>
          )}

          <Separator />

          {/* Layout */}
          <div>
            <p className="text-sm text-muted-foreground">Layout</p>
            <p className="font-medium capitalize">{data.layout || (data.locationAssets?.[0]?.layout)}</p>
          </div>

          <Separator />

          {/* What will be created */}
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <p className="font-medium mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              What will be generated:
            </p>
            <ul className="space-y-2 text-sm">
              <li>✓ {data.selectedLocations.length} asset(s) with unique QR codes</li>
              <li>✓ Location-specific UTM tracking parameters</li>
              <li>✓ Print-ready PDFs (generated in ~3-5 seconds each)</li>
              <li>✓ Real-time scan tracking</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
        <CardContent className="p-4">
          <p className="text-sm text-yellow-900 dark:text-yellow-100">
            ⚠️ <strong>Note:</strong> After clicking "Generate Assets", the PDFs will be created 
            in the background. You'll be redirected to the campaign page where you can download 
            them once ready (usually within 10-15 seconds).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### Step 10: Create Main Wizard Component

**File:** `src/pages/campaigns/New.tsx`

```typescript
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCampaignWizard } from '@/hooks/useCampaignWizard';
import { campaignAPI } from '@/lib/campaign-api';
import { Step1Goal } from '@/components/campaigns/wizard/Step1Goal';
import { Step2Locations } from '@/components/campaigns/wizard/Step2Locations';
import { Step3AssetType } from '@/components/campaigns/wizard/Step3AssetType';
import { Step4DesignShared } from '@/components/campaigns/wizard/Step4DesignShared';
import { Step4DesignPerLocation } from '@/components/campaigns/wizard/Step4DesignPerLocation';
import { Step5Review } from '@/components/campaigns/wizard/Step5Review';
import type { GenerateAssetsRequest } from '@/types/campaign';

const STEPS = [
  { number: 1, label: 'Goal' },
  { number: 2, label: 'Locations' },
  { number: 3, label: 'Asset Type' },
  { number: 4, label: 'Design' },
  { number: 5, label: 'Review' }
];

export default function NewCampaign() {
  const navigate = useNavigate();
  const { currentStep, wizardData, updateData, canProceed, nextStep, prevStep } = useCampaignWizard();
  const [campaignId, setCampaignId] = useState<string | null>(null);

  // Create campaign mutation
  const { mutate: createCampaign, isPending: isCreatingCampaign } = useMutation({
    mutationFn: () => campaignAPI.create({
      name: `${wizardData.goal} Campaign - ${new Date().toLocaleDateString()}`,
      goal: wizardData.goal!,
      description: 'Created via wizard'
    }),
    onSuccess: (campaign) => {
      setCampaignId(campaign.id);
      toast.success('Campaign created!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create campaign');
    }
  });

  // Generate assets mutation
  const { mutate: generateAssets, isPending: isGenerating } = useMutation({
    mutationFn: () => {
      if (!campaignId) throw new Error('Campaign ID not found');
      
      const request: GenerateAssetsRequest = {
        asset_type: wizardData.assetType!,
        base_url: wizardData.destinationUrl!
      };

      if (wizardData.customizePerLocation) {
        // Per-location mode
        request.assets = wizardData.locationAssets;
      } else {
        // Shared mode
        request.location_ids = wizardData.selectedLocations;
        request.layout = wizardData.layout;
        request.copy = wizardData.copy;
      }

      return campaignAPI.generateAssets(campaignId, request);
    },
    onSuccess: (response) => {
      toast.success(`${response.assets_created} asset(s) queued for generation!`);
      navigate(`/campaigns/${campaignId}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to generate assets');
    }
  });

  // Create campaign when moving from step 1 to 2
  useEffect(() => {
    if (currentStep === 2 && !campaignId && wizardData.goal) {
      createCampaign();
    }
  }, [currentStep, campaignId, wizardData.goal]);

  const handleNext = () => {
    nextStep();
  };

  const handleFinish = () => {
    generateAssets();
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="container max-w-4xl py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          <span className="text-muted-foreground">&gt;●</span> Create Campaign
        </h1>
        <p className="text-muted-foreground">
          Transform digital planning into physical flyers
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className={`text-sm font-medium transition-colors ${
                currentStep >= step.number
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              {step.label}
            </div>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Content */}
      <div className="mb-8">
        {currentStep === 1 && (
          <Step1Goal
            value={wizardData.goal}
            onChange={(goal) => updateData({ goal })}
          />
        )}

        {currentStep === 2 && (
          <Step2Locations
            value={wizardData.selectedLocations}
            onChange={(selectedLocations) => updateData({ selectedLocations })}
          />
        )}

        {currentStep === 3 && (
          <Step3AssetType
            assetType={wizardData.assetType}
            onAssetTypeChange={(assetType) => updateData({ assetType })}
            customizePerLocation={wizardData.customizePerLocation}
            onCustomizeChange={(customizePerLocation) => updateData({ customizePerLocation })}
          />
        )}

        {currentStep === 4 && !wizardData.customizePerLocation && (
          <Step4DesignShared
            destinationUrl={wizardData.destinationUrl || ''}
            onDestinationUrlChange={(destinationUrl) => updateData({ destinationUrl })}
            copy={wizardData.copy || { headline: '', subheadline: '', cta: '' }}
            onCopyChange={(copy) => updateData({ copy })}
            layout={wizardData.layout || 'modern'}
            onLayoutChange={(layout) => updateData({ layout })}
          />
        )}

        {currentStep === 4 && wizardData.customizePerLocation && (
          <Step4DesignPerLocation
            selectedLocationIds={wizardData.selectedLocations}
            destinationUrl={wizardData.destinationUrl || ''}
            onDestinationUrlChange={(destinationUrl) => updateData({ destinationUrl })}
            locationAssets={wizardData.locationAssets || []}
            onLocationAssetsChange={(locationAssets) => updateData({ locationAssets })}
          />
        )}

        {currentStep === 5 && (
          <Step5Review data={wizardData} />
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1 || isGenerating || isCreatingCampaign}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {currentStep < 5 ? (
          <Button
            onClick={handleNext}
            disabled={!canProceed || isCreatingCampaign}
          >
            {isCreatingCampaign ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={handleFinish}
            disabled={isGenerating}
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>Generate Assets</>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
```

---

## ✅ Testing Checklist

### 1. Test Wizard Navigation
- [ ] Can proceed through all 5 steps
- [ ] "Next" button disabled when step incomplete
- [ ] Progress bar updates correctly
- [ ] Can go back and change selections
- [ ] Campaign auto-creates when moving 1→2

### 2. Test Shared Copy Mode
- [ ] Toggle OFF: Shows single design form
- [ ] All fields validate (headline 60, subheadline 120, cta 40)
- [ ] Character counters update
- [ ] Layout selection works
- [ ] Review page shows correct summary

### 3. Test Per-Location Copy Mode
- [ ] Toggle ON: Shows tabs for each location
- [ ] Can customize copy independently per location
- [ ] Can select different layouts per location
- [ ] All locations show in review

### 4. Test Asset Generation
- [ ] "Generate Assets" makes single API call
- [ ] Request body matches backend expectation
- [ ] Success toast shows asset count
- [ ] Redirects to campaign detail page
- [ ] Campaign page polls for PDF completion

### 5. Test Error Handling
- [ ] Network errors show toast
- [ ] Can retry after failure
- [ ] Loading states show correctly
- [ ] Missing required fields prevent progression

---

## 🎯 Success Criteria

- ✅ Wizard flow matches backend architecture
- ✅ Single atomic API call to `/generate-flyer`
- ✅ Supports both shared and per-location copy modes
- ✅ No component library complexity
- ✅ Campaign created before asset generation
- ✅ Proper validation at each step
- ✅ Clean, simple UX

---

## 🚨 Critical Notes

- **Backend must be deployed first** - This depends on fix_campaign_asset_generation_flow.md
- **Endpoint:** `/api/internal/campaigns/:id/generate-flyer` (not generate-assets)
- **Request body:** Must match backend's flexible format (location_ids OR assets)
- **Character limits:** Enforced in UI to match template constraints
- **Campaign creation:** Auto-triggered when moving from Step 1→2
- **Destination URL:** Required for QR code base_url

---

## 📝 Migration from Old Wizard

If updating existing wizard:

1. Remove component library components/hooks
2. Remove AI copy generation (if present)
3. Replace multi-step API calls with single generate-flyer call
4. Update types to match new backend schema
5. Test both shared and per-location modes thoroughly

---

**STATUS: READY FOR IMPLEMENTATION** 🚀

**Estimated Time:** 3-4 hours
**Dependencies:** Backend fix deployed
**Risk Level:** LOW - Clean implementation, no data migration needed
