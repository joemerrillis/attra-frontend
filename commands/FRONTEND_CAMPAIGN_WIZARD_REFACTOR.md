# FRONTEND_CAMPAIGN_WIZARD_REFACTOR.md

## 🎯 Goal

Rebuild the campaign creation wizard to match the new backend architecture. The wizard will collect all necessary data (locations, asset type, components, layout) BEFORE triggering asset generation, ensuring proper data flow and eliminating race conditions.

**Priority:** CRITICAL - Matches backend refactor
**Estimated Time:** 4-5 hours
**Dependencies:** BACKEND_CAMPAIGN_ARCHITECTURE_REFACTOR.md must be completed first

---

## 🎨 New Wizard Flow

```
Step 1: Campaign Goal
Step 2: Select Locations (NEW - REQUIRED)
Step 3: Choose Asset Type (NEW)
Step 4: Build Components (ENHANCED with reuse)
Step 5: Choose Layout
Step 6: Review & Generate (NEW - shows summary)
```

**Key Changes from Current:**
- ❌ Remove: Immediate PDF generation after layout selection
- ✅ Add: Location selection before any generation
- ✅ Add: Asset type selection
- ✅ Add: Component library with reuse options
- ✅ Add: Review page showing what will be created
- ✅ Change: Single atomic API call instead of multiple

---

## 📋 Step-by-Step Implementation

### Step 1: Update Campaign Creation Types

**File:** `src/types/campaign.ts`

```typescript
export interface Campaign {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  goal: CampaignGoal;
  status: 'draft' | 'active' | 'completed';
  created_at: string;
  updated_at: string;
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
  | 'business_card' 
  | 'yard_sign' 
  | 'window_cling';

export type ComponentType = 
  | 'headline' 
  | 'subheadline' 
  | 'offer' 
  | 'cta';

export interface Component {
  id: string;
  tenant_id: string;
  component_type: ComponentType;
  name: string;
  content: Record<string, any>;
  usage_count: number;
  avg_conversion_rate: number | null;
  created_at: string;
}

export interface AssetDesign {
  id: string;
  tenant_id: string;
  name: string;
  asset_type: AssetType;
  layout: 'classic' | 'modern' | 'minimal';
  is_location_specific: boolean;
  created_at: string;
}

export interface Asset {
  id: string;
  tenant_id: string;
  campaign_id: string;
  asset_design_id: string;
  location_id: string | null;
  name: string;
  asset_type: AssetType;
  file_url: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface CampaignWizardData {
  goal: CampaignGoal;
  locations: string[];
  assetType: AssetType;
  components: {
    headline?: { id?: string; content?: any };
    subheadline?: { id?: string; content?: any };
    offer?: { id?: string; content?: any };
    cta?: { id?: string; content?: any };
  };
  layout: 'classic' | 'modern' | 'minimal';
}
```

---

### Step 2: Create Component API Client

**File:** `src/lib/components-api.ts`

```typescript
import { fetchWithAuth } from './api';
import type { Component, ComponentType } from '@/types/campaign';

export const componentsAPI = {
  /**
   * Get top performing components by type
   */
  async getTopComponents(type: ComponentType, limit = 10): Promise<Component[]> {
    const response = await fetchWithAuth(
      `/api/internal/components?type=${type}&limit=${limit}`
    );
    return response.components || [];
  },

  /**
   * Create new component
   */
  async createComponent(data: {
    component_type: ComponentType;
    name: string;
    content: Record<string, any>;
  }): Promise<Component> {
    const response = await fetchWithAuth('/api/internal/components', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response.component;
  }
};
```

---

### Step 3: Create Campaign Assets API Client

**File:** `src/lib/campaign-assets-api.ts`

```typescript
import { fetchWithAuth } from './api';
import type { CampaignWizardData, Asset, AssetDesign } from '@/types/campaign';

export const campaignAssetsAPI = {
  /**
   * Generate all assets for a campaign atomically
   */
  async generateAssets(campaignId: string, data: CampaignWizardData) {
    const response = await fetchWithAuth(
      `/api/internal/campaigns/${campaignId}/generate-assets`,
      {
        method: 'POST',
        body: JSON.stringify({
          locations: data.locations,
          assetType: data.assetType,
          layout: data.layout,
          components: data.components
        })
      }
    );
    return response;
  },

  /**
   * Get assets for a campaign
   */
  async getCampaignAssets(campaignId: string): Promise<Asset[]> {
    const response = await fetchWithAuth(
      `/api/internal/campaigns/${campaignId}/assets`
    );
    return response.assets || [];
  }
};
```

---

### Step 4: Create Wizard State Hook

**File:** `src/hooks/useCampaignWizard.ts`

```typescript
import { useState } from 'react';
import type { CampaignWizardData, CampaignGoal, AssetType } from '@/types/campaign';

export function useCampaignWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<Partial<CampaignWizardData>>({
    locations: [],
    components: {}
  });

  const updateWizardData = (updates: Partial<CampaignWizardData>) => {
    setWizardData(prev => ({ ...prev, ...updates }));
  };

  const canProceed = (step: number): boolean => {
    switch (step) {
      case 1: // Goal
        return !!wizardData.goal;
      case 2: // Locations
        return (wizardData.locations?.length || 0) > 0;
      case 3: // Asset Type
        return !!wizardData.assetType;
      case 4: // Components
        return !!wizardData.components?.headline?.content;
      case 5: // Layout
        return !!wizardData.layout;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (canProceed(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 6));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const resetWizard = () => {
    setCurrentStep(1);
    setWizardData({ locations: [], components: {} });
  };

  return {
    currentStep,
    wizardData,
    updateWizardData,
    canProceed: canProceed(currentStep),
    nextStep,
    prevStep,
    resetWizard
  };
}
```

---

### Step 5: Create Step 1 - Goal Selection

**File:** `src/components/campaigns/wizard/Step1Goal.tsx`

```typescript
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import type { CampaignGoal } from '@/types/campaign';

const CAMPAIGN_GOALS: Array<{
  value: CampaignGoal;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    value: 'new_clients',
    label: 'New Clients',
    description: 'Attract new customers to your business',
    icon: '🎯'
  },
  {
    value: 'retention',
    label: 'Retention',
    description: 'Keep existing customers engaged',
    icon: '🔄'
  },
  {
    value: 'event_promo',
    label: 'Event Promotion',
    description: 'Promote a specific event or date',
    icon: '📅'
  },
  {
    value: 'seasonal',
    label: 'Seasonal',
    description: 'Seasonal offers and promotions',
    icon: '🌟'
  },
  {
    value: 'awareness',
    label: 'Brand Awareness',
    description: 'Increase visibility and recognition',
    icon: '💡'
  }
];

interface Step1GoalProps {
  value: CampaignGoal | undefined;
  onChange: (goal: CampaignGoal) => void;
}

export function Step1Goal({ value, onChange }: Step1GoalProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">What's your campaign goal?</h2>
        <p className="text-muted-foreground">
          This helps us optimize your campaign for success
        </p>
      </div>

      <RadioGroup value={value} onValueChange={onChange}>
        <div className="grid gap-4">
          {CAMPAIGN_GOALS.map(goal => (
            <Card 
              key={goal.value}
              className={`cursor-pointer transition-all ${
                value === goal.value 
                  ? 'border-primary ring-2 ring-primary ring-offset-2' 
                  : 'hover:border-gray-400'
              }`}
              onClick={() => onChange(goal.value)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{goal.icon}</div>
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <RadioGroupItem value={goal.value} id={goal.value} />
                      <Label htmlFor={goal.value} className="cursor-pointer">
                        {goal.label}
                      </Label>
                    </CardTitle>
                    <CardDescription>{goal.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </RadioGroup>
    </div>
  );
}
```

---

### Step 6: Create Step 2 - Location Selection

**File:** `src/components/campaigns/wizard/Step2Locations.tsx`

```typescript
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import { useLocations } from '@/hooks/useLocations';

interface Step2LocationsProps {
  value: string[];
  onChange: (locations: string[]) => void;
}

export function Step2Locations({ value, onChange }: Step2LocationsProps) {
  const { data: locations, isLoading } = useLocations();

  const toggleLocation = (locationId: string) => {
    if (value.includes(locationId)) {
      onChange(value.filter(id => id !== locationId));
    } else {
      onChange([...value, locationId]);
    }
  };

  const selectAll = () => {
    onChange(locations?.map(l => l.id) || []);
  };

  const clearAll = () => {
    onChange([]);
  };

  if (isLoading) {
    return <div>Loading locations...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Select Locations</h2>
        <p className="text-muted-foreground">
          Choose which locations will use this campaign
        </p>
      </div>

      <div className="flex justify-between items-center">
        <Badge variant="outline">
          {value.length} of {locations?.length || 0} selected
        </Badge>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="text-sm text-primary hover:underline"
          >
            Select All
          </button>
          <span className="text-muted-foreground">•</span>
          <button
            type="button"
            onClick={clearAll}
            className="text-sm text-primary hover:underline"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="grid gap-3">
        {locations?.map(location => (
          <Card 
            key={location.id}
            className={`cursor-pointer transition-all ${
              value.includes(location.id)
                ? 'border-primary bg-primary/5'
                : 'hover:border-gray-400'
            }`}
            onClick={() => toggleLocation(location.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={value.includes(location.id)}
                  onCheckedChange={() => toggleLocation(location.id)}
                />
                <div className="flex-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {location.name}
                  </CardTitle>
                  {location.address && (
                    <CardDescription className="mt-1">
                      {location.address}
                      {location.city && `, ${location.city}`}
                      {location.state && `, ${location.state}`}
                    </CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {locations?.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              No locations found. Add a location first before creating campaigns.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

---

### Step 7: Create Step 3 - Asset Type Selection

**File:** `src/components/campaigns/wizard/Step3AssetType.tsx`

```typescript
import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import type { AssetType } from '@/types/campaign';

const ALL_ASSET_TYPES: Array<{
  value: AssetType;
  label: string;
  description: string;
  locationSpecific: boolean;
  multipleInstances: boolean;
  verticals: string[]; // Which verticals can use this asset type
}> = [
  {
    value: 'flyer',
    label: 'Flyer',
    description: 'Standard 8.5x11 marketing flyer',
    locationSpecific: true,
    multipleInstances: false,
    verticals: ['dog_walking', 'restaurant', 'real_estate', 'fitness', 'retail', 'general']
  },
  {
    value: 'door_hanger',
    label: 'Door Hanger',
    description: 'Leave at customer doors',
    locationSpecific: true,
    multipleInstances: false,
    verticals: ['dog_walking', 'real_estate', 'fitness', 'general']
  },
  {
    value: 'table_tent',
    label: 'Table Tent',
    description: 'Place on restaurant tables',
    locationSpecific: true,
    multipleInstances: true,
    verticals: ['restaurant'] // ⭐ ONLY restaurants
  },
  {
    value: 'menu_board',
    label: 'Menu Board',
    description: 'Display menu with QR code',
    locationSpecific: true,
    multipleInstances: true,
    verticals: ['restaurant'] // ⭐ ONLY restaurants
  },
  {
    value: 'business_card',
    label: 'Business Card',
    description: 'Standard business card (shared across locations)',
    locationSpecific: false,
    multipleInstances: false,
    verticals: ['dog_walking', 'real_estate', 'fitness', 'retail', 'general']
  },
  {
    value: 'yard_sign',
    label: 'Yard Sign',
    description: 'Real estate yard sign',
    locationSpecific: true,
    multipleInstances: false,
    verticals: ['real_estate'] // ⭐ ONLY real estate
  },
  {
    value: 'window_cling',
    label: 'Window Cling',
    description: 'Storefront window display',
    locationSpecific: true,
    multipleInstances: false,
    verticals: ['restaurant', 'fitness', 'retail']
  }
];

interface Step3AssetTypeProps {
  value: AssetType | undefined;
  onChange: (assetType: AssetType) => void;
}

export function Step3AssetType({ value, onChange }: Step3AssetTypeProps) {
  const { user } = useAuth();
  const tenantVertical = user?.tenant?.vertical || 'general';

  // Filter asset types based on tenant's vertical
  const availableAssetTypes = useMemo(() => {
    return ALL_ASSET_TYPES.filter(assetType => 
      assetType.verticals.includes(tenantVertical) ||
      assetType.verticals.includes('general')
    );
  }, [tenantVertical]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Choose Asset Type</h2>
        <p className="text-muted-foreground">
          What type of marketing material are you creating?
        </p>
      </div>

      {availableAssetTypes.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              No asset types available for your business type. Contact support for custom asset types.
            </p>
          </CardContent>
        </Card>
      )}

      <RadioGroup value={value} onValueChange={onChange}>
        <div className="grid gap-4">
          {availableAssetTypes.map(assetType => (
            <Card
              key={assetType.value}
              className={`cursor-pointer transition-all ${
                value === assetType.value
                  ? 'border-primary ring-2 ring-primary ring-offset-2'
                  : 'hover:border-gray-400'
              }`}
              onClick={() => onChange(assetType.value)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <RadioGroupItem value={assetType.value} id={assetType.value} />
                    <div>
                      <Label htmlFor={assetType.value} className="cursor-pointer">
                        <CardTitle className="text-lg">{assetType.label}</CardTitle>
                      </Label>
                      <CardDescription className="mt-1">
                        {assetType.description}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    {assetType.locationSpecific && (
                      <Badge variant="secondary" className="text-xs">
                        Location-specific
                      </Badge>
                    )}
                    {assetType.multipleInstances && (
                      <Badge variant="secondary" className="text-xs">
                        Multiple per location
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </RadioGroup>
    </div>
  );
}
```

---

### Step 8: Create Step 4 - Component Builder

**File:** `src/components/campaigns/wizard/Step4Components.tsx`

```typescript
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { componentsAPI } from '@/lib/components-api';
import type { ComponentType } from '@/types/campaign';

interface Step4ComponentsProps {
  value: Record<string, any>;
  onChange: (components: Record<string, any>) => void;
}

export function Step4Components({ value, onChange }: Step4ComponentsProps) {
  const [headlineChoice, setHeadlineChoice] = useState<'existing' | 'new'>('new');
  const [newHeadlineText, setNewHeadlineText] = useState('');

  const { data: existingHeadlines } = useQuery({
    queryKey: ['components', 'headline'],
    queryFn: () => componentsAPI.getTopComponents('headline', 5)
  });

  const handleHeadlineSelect = (componentId: string) => {
    onChange({
      ...value,
      headline: { id: componentId }
    });
  };

  const handleNewHeadline = () => {
    onChange({
      ...value,
      headline: {
        content: { text: newHeadlineText }
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Build Your Message</h2>
        <p className="text-muted-foreground">
          Create new components or reuse top performers from past campaigns
        </p>
      </div>

      {/* Headline Component */}
      <Card>
        <CardHeader>
          <CardTitle>Headline</CardTitle>
          <CardDescription>The main attention-grabbing message</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup value={headlineChoice} onValueChange={(v: any) => setHeadlineChoice(v)}>
            {existingHeadlines && existingHeadlines.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Use existing headline</Label>
                {existingHeadlines.map(comp => (
                  <div
                    key={comp.id}
                    className={`flex items-center justify-between p-3 border rounded hover:bg-gray-50 cursor-pointer ${
                      value.headline?.id === comp.id ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => {
                      setHeadlineChoice('existing');
                      handleHeadlineSelect(comp.id);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value={comp.id} />
                      <div>
                        <p className="font-medium">{comp.content.text}</p>
                        <p className="text-sm text-muted-foreground">
                          Used {comp.usage_count} times
                          {comp.avg_conversion_rate && (
                            <> • {comp.avg_conversion_rate}% avg conversion</>
                          )}
                        </p>
                      </div>
                    </div>
                    {comp.avg_conversion_rate && comp.avg_conversion_rate > 15 && (
                      <Badge variant="default">⭐ Top Performer</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="new" id="new-headline" />
                <Label htmlFor="new-headline" className="cursor-pointer flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Create new headline
                </Label>
              </div>

              {headlineChoice === 'new' && (
                <div className="ml-6 space-y-2">
                  <Input
                    placeholder="Enter your headline..."
                    value={newHeadlineText}
                    onChange={(e) => setNewHeadlineText(e.target.value)}
                    onBlur={handleNewHeadline}
                  />
                  <Button variant="outline" size="sm" className="w-full">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate with AI
                  </Button>
                </div>
              )}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Add similar sections for subheadline, offer, CTA */}
    </div>
  );
}
```

---

### Step 9: Create Step 6 - Review & Generate

**Note:** Step 6 is "Configure Instances" for multi-instance asset types (table_tent, menu_board). This step is **conditionally shown only for restaurants** who selected an asset type with `multipleInstances: true`.

For MVP, we can skip this step and default to 1 instance per location. Future enhancement: allow restaurants to configure multiple table tents per location with custom names/metadata.

**File:** `src/components/campaigns/wizard/Step6Review.tsx`

```typescript
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle } from 'lucide-react';
import type { CampaignWizardData } from '@/types/campaign';
import { useLocations } from '@/hooks/useLocations';

interface Step6ReviewProps {
  data: Partial<CampaignWizardData>;
}

export function Step6Review({ data }: Step6ReviewProps) {
  const { data: allLocations } = useLocations();
  
  const selectedLocations = allLocations?.filter(l => 
    data.locations?.includes(l.id)
  ) || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Review & Generate</h2>
        <p className="text-muted-foreground">
          Verify your campaign details before generating assets
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
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

          {/* Locations */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Locations ({selectedLocations.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedLocations.map(loc => (
                <Badge key={loc.id} variant="secondary">
                  {loc.name}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Asset Type */}
          <div>
            <p className="text-sm text-muted-foreground">Asset Type</p>
            <p className="font-medium capitalize">{data.assetType?.replace('_', ' ')}</p>
          </div>

          <Separator />

          {/* Layout */}
          <div>
            <p className="text-sm text-muted-foreground">Layout</p>
            <p className="font-medium capitalize">{data.layout}</p>
          </div>

          <Separator />

          {/* Components */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Components</p>
            <div className="space-y-1">
              {data.components?.headline && (
                <p className="text-sm">
                  • Headline: {data.components.headline.content?.text || 'Selected'}
                </p>
              )}
              {data.components?.offer && (
                <p className="text-sm">
                  • Offer: {data.components.offer.content?.text || 'Selected'}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* What will be created */}
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <p className="font-medium mb-2">What will be generated:</p>
            <ul className="space-y-1 text-sm">
              <li>✓ {selectedLocations.length} QR codes (one per location)</li>
              <li>✓ {selectedLocations.length} {data.assetType} PDFs</li>
              <li>✓ Attribution tracking for all scans</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### Step 10: Update Main Wizard Component

**File:** `src/pages/campaigns/New.tsx`

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCampaignWizard } from '@/hooks/useCampaignWizard';
import { campaignAssetsAPI } from '@/lib/campaign-assets-api';
import { Step1Goal } from '@/components/campaigns/wizard/Step1Goal';
import { Step2Locations } from '@/components/campaigns/wizard/Step2Locations';
import { Step3AssetType } from '@/components/campaigns/wizard/Step3AssetType';
import { Step4Components } from '@/components/campaigns/wizard/Step4Components';
import { Step5Layout } from '@/components/campaigns/wizard/Step5Layout';
import { Step6Review } from '@/components/campaigns/wizard/Step6Review';
import { toast } from 'sonner';

const STEPS = [
  { number: 1, label: 'Goal' },
  { number: 2, label: 'Locations' },
  { number: 3, label: 'Asset Type' },
  { number: 4, label: 'Components' },
  { number: 5, label: 'Layout' },
  { number: 6, label: 'Review' }
];

export default function NewCampaign() {
  const navigate = useNavigate();
  const { 
    currentStep, 
    wizardData, 
    updateWizardData, 
    canProceed,
    nextStep, 
    prevStep 
  } = useCampaignWizard();

  const [campaignId, setCampaignId] = useState<string | null>(null);

  const { mutate: createCampaign, isPending: isCreatingCampaign } = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/internal/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${wizardData.goal} Campaign - ${new Date().toLocaleDateString()}`,
          goal: wizardData.goal,
          status: 'draft'
        })
      });
      return response.json();
    },
    onSuccess: (data) => {
      setCampaignId(data.id);
    }
  });

  const { mutate: generateAssets, isPending: isGenerating } = useMutation({
    mutationFn: () => campaignAssetsAPI.generateAssets(campaignId!, wizardData as any),
    onSuccess: (data) => {
      toast.success(`${data.assets.length} assets queued for generation!`);
      navigate(`/campaigns/${campaignId}`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to generate assets');
    }
  });

  const handleNext = () => {
    if (currentStep === 1 && !campaignId) {
      // Create campaign before moving to step 2
      createCampaign();
    }
    nextStep();
  };

  const handleFinish = () => {
    if (!campaignId) return;
    generateAssets();
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="container max-w-4xl py-8">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {STEPS.map(step => (
            <div
              key={step.number}
              className={`text-sm font-medium ${
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
            onChange={(goal) => updateWizardData({ goal })}
          />
        )}
        {currentStep === 2 && (
          <Step2Locations
            value={wizardData.locations || []}
            onChange={(locations) => updateWizardData({ locations })}
          />
        )}
        {currentStep === 3 && (
          <Step3AssetType
            value={wizardData.assetType}
            onChange={(assetType) => updateWizardData({ assetType })}
          />
        )}
        {currentStep === 4 && (
          <Step4Components
            value={wizardData.components || {}}
            onChange={(components) => updateWizardData({ components })}
          />
        )}
        {currentStep === 5 && (
          <Step5Layout
            value={wizardData.layout}
            onChange={(layout) => updateWizardData({ layout })}
          />
        )}
        {currentStep === 6 && (
          <Step6Review data={wizardData} />
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1 || isGenerating}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {currentStep < 6 ? (
          <Button
            onClick={handleNext}
            disabled={!canProceed || isCreatingCampaign}
          >
            {isCreatingCampaign ? 'Creating...' : 'Next'}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleFinish}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate Assets'}
          </Button>
        )}
      </div>
    </div>
  );
}
```

---

## ✅ Testing Checklist

After implementation:

### 1. Test Wizard Flow
- [ ] Can navigate through all 6 steps
- [ ] "Next" button disabled when step incomplete
- [ ] Progress bar updates correctly
- [ ] Can go back and change selections
- [ ] Campaign created on step 1 → 2 transition

### 2. Test Location Selection
- [ ] All locations load from API
- [ ] Can select/deselect individual locations
- [ ] "Select All" and "Clear All" work
- [ ] Selected count updates correctly

### 3. Test Component Library
- [ ] Existing components load with performance data
- [ ] Can select existing component
- [ ] Can create new component
- [ ] New text updates wizard data

### 4. Test Asset Generation
- [ ] Review page shows correct summary
- [ ] "Generate Assets" makes single API call
- [ ] Success message shows correct asset count
- [ ] Redirects to campaign detail page
- [ ] Campaign detail page polls for PDF completion

### 5. Test Error Handling
- [ ] Network errors show toast message
- [ ] Can retry after failure
- [ ] Loading states show correctly

---

## 🎯 Success Criteria

- ✅ Wizard collects all data before API call
- ✅ Single atomic API call to generate assets
- ✅ No race conditions between QR creation and PDF generation
- ✅ Component reuse works correctly
- ✅ Campaign detail page shows generated assets
- ✅ PDFs download successfully after worker completes

---

## 🔄 Migration Notes

**For Existing Users:**

1. Old `generate-flyer` endpoint returns 410 (Gone)
2. Frontend shows migration notice if old endpoint hit
3. Guide users to create new campaign with new wizard

**Backwards Compatibility:**

- Old campaigns still viewable
- Old assets still downloadable
- New wizard required for new campaigns only
