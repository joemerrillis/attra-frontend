# Build Campaign Wizard

## Objective
Create an outcome-based campaign wizard that guides tenants through creating their first (and subsequent) marketing campaigns. The wizard should generate AI-powered copy, allow location selection, let users choose layout styles, and generate print-ready flyers with embedded QR codes. Emphasizes "what are you trying to accomplish?" over "design your own flyer."

## Dependencies
- ✅ `03_build_onboarding_wizard.md` (tenant + location exist)
- ✅ Backend file 07 (QR/UTM generation)
- ✅ `05_build_ai_copy_generation_service.md` (AI copy API)
- ✅ `06_build_pdf_generation_service.md` (PDF rendering)

## Philosophy
**"Tell us what you're promoting. We'll design the rest."**
- User chooses goal → System generates copy
- User picks locations → System creates location-specific QRs
- User selects layout → System renders branded flyer
- No pixel-pushing, no freeform design tools

---

## Tech Stack
- **Frontend:** React + TypeScript, React Hook Form + Zod, Shadcn/ui
- **State:** React Query for API calls, useState for wizard steps
- **Preview:** PDF.js or iframe for PDF preview
- **File Download:** Browser download API

---

## File Structure

```
src/
├── pages/
│   └── campaigns/
│       ├── New.tsx
│       ├── Edit.tsx
│       └── Detail.tsx
├── components/
│   └── campaigns/
│       ├── CampaignWizard.tsx
│       ├── GoalSelector.tsx
│       ├── CopyEditor.tsx
│       ├── LocationSelector.tsx
│       ├── LayoutSelector.tsx
│       ├── PDFPreview.tsx
│       └── CampaignSummary.tsx
├── hooks/
│   ├── useCampaign.ts
│   ├── useAICopy.ts
│   └── usePDFGeneration.ts
└── lib/
    └── campaign-utils.ts
```

---

## Database Schema (Reference)

These tables should already exist from backend:

```sql
-- Campaigns
CREATE TABLE ops.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  goal text, -- e.g., 'open_house', 'new_clients', 'referrals'
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  headline text,
  subheadline text,
  layout_key text DEFAULT 'classic', -- 'classic', 'modern', 'minimal'
  copy_config jsonb, -- Stores AI-generated variations
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Campaign Locations (many-to-many)
CREATE TABLE ops.campaign_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES ops.campaigns(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES ops.locations(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT NOW(),
  UNIQUE(campaign_id, location_id)
);

-- Assets (generated flyers)
CREATE TABLE ops.assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES ops.campaigns(id) ON DELETE CASCADE,
  location_id uuid REFERENCES ops.locations(id) ON DELETE SET NULL,
  asset_type text DEFAULT 'flyer',
  file_url text NOT NULL, -- Supabase Storage URL
  qr_link_id uuid REFERENCES ops.qr_links(id),
  created_at timestamptz DEFAULT NOW()
);
```

---

## Campaign Wizard Flow

### Step 1: Campaign Goal
**Question:** "What are you promoting?"
**UI:** Cards with goal options (varies by vertical)

**Example for Real Estate:**
- Open House
- New Listing
- Referral Program
- Neighborhood Update

**Example for Dog Walking:**
- New Clients
- Referral Bonus
- Seasonal Promotion
- Service Expansion

### Step 2: Generate Copy (AI)
**Question:** "Let AI write your headline"
**UI:** 
- Loading state while AI generates
- Shows 3 variations
- User can regenerate or edit manually
- Preview shows copy on flyer template

### Step 3: Select Locations
**Question:** "Where will you distribute these flyers?"
**UI:**
- List of tenant's locations
- Multi-select checkboxes
- Each location gets unique QR code
- "Add new location" button

### Step 4: Choose Layout
**Question:** "Pick your style"
**UI:**
- 3 visual previews (Classic, Modern, Minimal)
- Radio selection
- Preview updates in real-time

### Step 5: Review & Generate
**Question:** "Ready to print?"
**UI:**
- Summary of campaign
- Flyer preview
- Generate button
- Download all PDFs (zip if multiple locations)

---

## Implementation

### 1. Campaign Hook

**File:** `src/hooks/useCampaign.ts`

```typescript
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface CampaignData {
  name: string;
  goal: string;
  headline: string;
  subheadline: string;
  layout_key: string;
  location_ids: string[];
}

export const useCampaign = () => {
  const { tenant } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const createCampaign = useMutation({
    mutationFn: async (data: CampaignData) => {
      const response = await api.post('/api/campaigns', {
        tenant_id: tenant?.id,
        ...data,
        status: 'draft'
      });
      return response.data;
    },
    onSuccess: (campaign) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      navigate(`/campaigns/${campaign.id}`);
    }
  });

  const generateAssets = useMutation({
    mutationFn: async (campaignId: string) => {
      const response = await api.post(`/api/campaigns/${campaignId}/generate-assets`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    }
  });

  return {
    createCampaign,
    generateAssets
  };
};
```

---

### 2. AI Copy Hook

**File:** `src/hooks/useAICopy.ts`

```typescript
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';

interface GenerateCopyParams {
  goal: string;
  vertical: string;
  location_name?: string;
  additional_context?: string;
}

export const useAICopy = () => {
  const { tenant } = useAuth();
  
  const generateCopy = useMutation({
    mutationFn: async (params: GenerateCopyParams) => {
      const response = await api.post('/api/ai/generate-copy', {
        tenant_id: tenant?.id,
        ...params
      });
      return response.data;
    }
  });

  return {
    generateCopy: generateCopy.mutate,
    isGenerating: generateCopy.isPending,
    variations: generateCopy.data?.variations || [],
    error: generateCopy.error
  };
};
```

---

### 3. Goal Selector Component

**File:** `src/components/campaigns/GoalSelector.tsx`

```typescript
import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Target, Users, Gift, Home, Megaphone } from 'lucide-react';

const goalIcons: Record<string, any> = {
  open_house: Home,
  new_listing: Target,
  referrals: Users,
  promotion: Gift,
  awareness: Megaphone
};

interface GoalSelectorProps {
  vertical: string;
  value: string;
  onChange: (value: string) => void;
}

const goalsByVertical: Record<string, Array<{ key: string; label: string; description: string }>> = {
  real_estate: [
    { key: 'open_house', label: 'Promote an Open House', description: 'Drive attendance to property showing' },
    { key: 'new_listing', label: 'Announce New Listing', description: 'Generate leads for new property' },
    { key: 'referrals', label: 'Generate Referrals', description: 'Encourage word-of-mouth marketing' }
  ],
  pet_services: [
    { key: 'new_clients', label: 'Get More Clients', description: 'Attract new pet owners' },
    { key: 'referrals', label: 'Referral Program', description: 'Reward existing clients for referrals' },
    { key: 'promotion', label: 'Special Offer', description: 'Promote discount or seasonal deal' }
  ],
  home_services: [
    { key: 'new_area', label: 'Service Area Expansion', description: 'Announce availability in new neighborhood' },
    { key: 'promotion', label: 'Special Offer', description: 'Limited-time discount or package deal' },
    { key: 'referrals', label: 'Referral Program', description: 'Grow through customer recommendations' }
  ]
};

export const GoalSelector: React.FC<GoalSelectorProps> = ({ vertical, value, onChange }) => {
  const goals = goalsByVertical[vertical] || goalsByVertical.pet_services;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">What are you promoting?</h2>
      <p className="text-gray-600 mb-6">
        We'll customize your flyer based on your goal
      </p>

      <RadioGroup value={value} onValueChange={onChange}>
        <div className="space-y-3">
          {goals.map((goal) => {
            const Icon = goalIcons[goal.key] || Target;
            return (
              <Label
                key={goal.key}
                htmlFor={goal.key}
                className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:border-blue-300 transition-colors"
              >
                <RadioGroupItem
                  value={goal.key}
                  id={goal.key}
                  className="mt-1 flex-shrink-0"
                />
                <Icon className="w-6 h-6 text-blue-600 mx-3 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">{goal.label}</div>
                  <div className="text-sm text-gray-600">{goal.description}</div>
                </div>
              </Label>
            );
          })}
        </div>
      </RadioGroup>
    </div>
  );
};
```

---

### 4. Copy Editor Component

**File:** `src/components/campaigns/CopyEditor.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { useAICopy } from '@/hooks/useAICopy';

interface CopyEditorProps {
  goal: string;
  vertical: string;
  headline: string;
  subheadline: string;
  onHeadlineChange: (value: string) => void;
  onSubheadlineChange: (value: string) => void;
}

export const CopyEditor: React.FC<CopyEditorProps> = ({
  goal,
  vertical,
  headline,
  subheadline,
  onHeadlineChange,
  onSubheadlineChange
}) => {
  const { generateCopy, isGenerating, variations } = useAICopy();
  const [showVariations, setShowVariations] = useState(false);

  useEffect(() => {
    // Auto-generate on mount if headline is empty
    if (!headline && goal) {
      handleGenerate();
    }
  }, []);

  const handleGenerate = () => {
    generateCopy(
      { goal, vertical },
      {
        onSuccess: (data) => {
          if (data.variations && data.variations.length > 0) {
            onHeadlineChange(data.variations[0].headline);
            onSubheadlineChange(data.variations[0].subheadline);
            setShowVariations(true);
          }
        }
      }
    );
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Your Marketing Copy</h2>
      <p className="text-gray-600 mb-6">
        AI-generated copy based on your goal. Edit as needed.
      </p>

      {isGenerating ? (
        <div className="flex items-center justify-center py-12 border-2 border-dashed rounded-lg">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
            <p className="text-gray-600">Generating perfect copy...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Headline */}
          <div>
            <Label htmlFor="headline">Headline</Label>
            <Input
              id="headline"
              value={headline}
              onChange={(e) => onHeadlineChange(e.target.value)}
              placeholder="Your attention-grabbing headline"
              maxLength={60}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              {headline.length}/60 characters
            </p>
          </div>

          {/* Subheadline */}
          <div>
            <Label htmlFor="subheadline">Subheadline</Label>
            <Textarea
              id="subheadline"
              value={subheadline}
              onChange={(e) => onSubheadlineChange(e.target.value)}
              placeholder="Supporting details"
              maxLength={140}
              rows={3}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              {subheadline.length}/140 characters
            </p>
          </div>

          {/* Regenerate button */}
          <Button
            variant="outline"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Regenerate with AI
          </Button>

          {/* Variations */}
          {showVariations && variations.length > 1 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold mb-3 flex items-center">
                <Sparkles className="w-4 h-4 mr-2 text-blue-600" />
                Other AI Variations
              </h3>
              <div className="space-y-2">
                {variations.slice(1).map((variation: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onHeadlineChange(variation.headline);
                      onSubheadlineChange(variation.subheadline);
                    }}
                    className="w-full text-left p-3 bg-white rounded border hover:border-blue-300 transition-colors"
                  >
                    <p className="font-medium text-sm">{variation.headline}</p>
                    <p className="text-xs text-gray-600">{variation.subheadline}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

---

### 5. Location Selector Component

**File:** `src/components/campaigns/LocationSelector.tsx`

```typescript
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';

interface LocationSelectorProps {
  selectedLocationIds: string[];
  onSelectionChange: (locationIds: string[]) => void;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  selectedLocationIds,
  onSelectionChange
}) => {
  const { tenant } = useAuth();

  const { data: locations, isLoading } = useQuery({
    queryKey: ['locations', tenant?.id],
    queryFn: async () => {
      const response = await api.get(`/api/locations?tenant_id=${tenant?.id}`);
      return response.data.locations;
    },
    enabled: !!tenant?.id
  });

  const toggleLocation = (locationId: string) => {
    if (selectedLocationIds.includes(locationId)) {
      onSelectionChange(selectedLocationIds.filter(id => id !== locationId));
    } else {
      onSelectionChange([...selectedLocationIds, locationId]);
    }
  };

  const selectAll = () => {
    onSelectionChange(locations.map((loc: any) => loc.id));
  };

  const deselectAll = () => {
    onSelectionChange([]);
  };

  if (isLoading) {
    return <div>Loading locations...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Where will you distribute?</h2>
      <p className="text-gray-600 mb-6">
        Each location gets a unique QR code for tracking
      </p>

      <div className="flex gap-2 mb-4">
        <Button variant="outline" size="sm" onClick={selectAll}>
          Select All
        </Button>
        <Button variant="outline" size="sm" onClick={deselectAll}>
          Deselect All
        </Button>
      </div>

      <div className="space-y-3 mb-4">
        {locations?.map((location: any) => (
          <Label
            key={location.id}
            htmlFor={location.id}
            className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
          >
            <Checkbox
              id={location.id}
              checked={selectedLocationIds.includes(location.id)}
              onCheckedChange={() => toggleLocation(location.id)}
            />
            <MapPin className="w-5 h-5 text-gray-400 mx-3" />
            <div className="flex-1">
              <p className="font-medium">{location.name}</p>
              <p className="text-sm text-gray-600">{location.address}</p>
            </div>
          </Label>
        ))}
      </div>

      <Button variant="outline" className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Add New Location
      </Button>

      {selectedLocationIds.length > 0 && (
        <p className="text-sm text-gray-600 mt-4">
          {selectedLocationIds.length} location{selectedLocationIds.length !== 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  );
};
```

---

### 6. Layout Selector Component

**File:** `src/components/campaigns/LayoutSelector.tsx`

```typescript
import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface LayoutSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const layouts = [
  {
    key: 'classic',
    name: 'Classic',
    description: 'Centered layout with bold headline',
    preview: '/layouts/classic-preview.svg' // You'd create these
  },
  {
    key: 'modern',
    name: 'Modern',
    description: 'Photo-focused with overlaid text',
    preview: '/layouts/modern-preview.svg'
  },
  {
    key: 'minimal',
    name: 'Minimal',
    description: 'Clean text-only design',
    preview: '/layouts/minimal-preview.svg'
  }
];

export const LayoutSelector: React.FC<LayoutSelectorProps> = ({ value, onChange }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Choose Your Style</h2>
      <p className="text-gray-600 mb-6">
        All layouts are professionally designed and print-ready
      </p>

      <RadioGroup value={value} onValueChange={onChange}>
        <div className="grid md:grid-cols-3 gap-4">
          {layouts.map((layout) => (
            <Label
              key={layout.key}
              htmlFor={layout.key}
              className="cursor-pointer"
            >
              <div className="border-2 rounded-lg overflow-hidden hover:border-blue-300 transition-colors">
                {/* Preview image placeholder */}
                <div className="aspect-[8.5/11] bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-400 text-sm">{layout.name} Preview</span>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{layout.name}</h3>
                    <RadioGroupItem value={layout.key} id={layout.key} />
                  </div>
                  <p className="text-sm text-gray-600">{layout.description}</p>
                </div>
              </div>
            </Label>
          ))}
        </div>
      </RadioGroup>
    </div>
  );
};
```

---

### 7. Main Campaign Wizard

**File:** `src/pages/campaigns/New.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCampaign } from '@/hooks/useCampaign';
import { GoalSelector } from '@/components/campaigns/GoalSelector';
import { CopyEditor } from '@/components/campaigns/CopyEditor';
import { LocationSelector } from '@/components/campaigns/LocationSelector';
import { LayoutSelector } from '@/components/campaigns/LayoutSelector';

export default function NewCampaign() {
  const navigate = useNavigate();
  const { tenant } = useAuth();
  const { createCampaign, generateAssets } = useCampaign();
  
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState('');
  const [headline, setHeadline] = useState('');
  const [subheadline, setSubheadline] = useState('');
  const [locationIds, setLocationIds] = useState<string[]>([]);
  const [layoutKey, setLayoutKey] = useState('classic');

  // Get campaign goal from localStorage (set during onboarding)
  useEffect(() => {
    const savedGoal = localStorage.getItem('attra_campaign_goal');
    if (savedGoal) {
      setGoal(savedGoal);
      localStorage.removeItem('attra_campaign_goal');
    }
  }, []);

  const canProceed = () => {
    switch (step) {
      case 1: return goal !== '';
      case 2: return headline.trim() !== '' && subheadline.trim() !== '';
      case 3: return locationIds.length > 0;
      case 4: return layoutKey !== '';
      default: return false;
    }
  };

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleCreate = async () => {
    try {
      const campaign = await createCampaign.mutateAsync({
        name: headline,
        goal,
        headline,
        subheadline,
        layout_key: layoutKey,
        location_ids: locationIds
      });

      // Generate assets (PDFs + QR codes)
      await generateAssets.mutateAsync(campaign.id);

      // Navigate to campaign detail
      navigate(`/campaigns/${campaign.id}`);
    } catch (error) {
      console.error('Failed to create campaign:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Step {step} of 5
            </span>
            <span className="text-sm text-gray-500">
              {Math.round((step / 5) * 100)}% complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          {step === 1 && (
            <GoalSelector
              vertical={tenant?.vertical || 'pet_services'}
              value={goal}
              onChange={setGoal}
            />
          )}

          {step === 2 && (
            <CopyEditor
              goal={goal}
              vertical={tenant?.vertical || 'pet_services'}
              headline={headline}
              subheadline={subheadline}
              onHeadlineChange={setHeadline}
              onSubheadlineChange={setSubheadline}
            />
          )}

          {step === 3 && (
            <LocationSelector
              selectedLocationIds={locationIds}
              onSelectionChange={setLocationIds}
            />
          )}

          {step === 4 && (
            <LayoutSelector
              value={layoutKey}
              onChange={setLayoutKey}
            />
          )}

          {step === 5 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">Review & Generate</h2>
              <p className="text-gray-600 mb-6">
                Everything looks good? Let's create your flyers!
              </p>

              <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Goal</p>
                  <p className="font-medium">{goal.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Headline</p>
                  <p className="font-medium">{headline}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Locations</p>
                  <p className="font-medium">{locationIds.length} selected</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Layout</p>
                  <p className="font-medium">{layoutKey}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1 || createCampaign.isPending}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            {step < 5 ? (
              <Button onClick={handleNext} disabled={!canProceed()}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleCreate}
                disabled={!canProceed() || createCampaign.isPending}
              >
                {createCampaign.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Campaign
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## API Integration

### Campaign API Client

```typescript
// lib/api-client.ts
export const campaignApi = {
  async create(data: CampaignData) {
    const response = await api.post('/api/campaigns', data);
    return response.data;
  },
  
  async generateAssets(campaignId: string) {
    const response = await api.post(`/api/campaigns/${campaignId}/generate-assets`);
    return response.data;
  },
  
  async getById(campaignId: string) {
    const response = await api.get(`/api/campaigns/${campaignId}`);
    return response.data;
  },
  
  async list(tenantId: string) {
    const response = await api.get(`/api/campaigns?tenant_id=${tenantId}`);
    return response.data;
  }
};
```

---

## Testing

### Manual Test Flow

1. **Navigate to `/campaigns/new`**
2. **Step 1:** Select goal (e.g., "Open House")
3. **Step 2:** Wait for AI copy generation → Edit if needed
4. **Step 3:** Select 2 locations
5. **Step 4:** Choose "Modern" layout
6. **Step 5:** Review → Click "Create Campaign"
7. **Verify:** Redirects to campaign detail page
8. **Verify:** PDFs are generated and downloadable
9. **Verify:** Each location has unique QR code

---

## Acceptance Criteria

- [ ] Campaign wizard loads at `/campaigns/new`
- [ ] Goal selector shows options based on vertical
- [ ] AI copy generates 3 variations
- [ ] User can edit copy manually
- [ ] User can regenerate AI copy
- [ ] Location selector shows all tenant locations
- [ ] Multiple locations can be selected
- [ ] Layout selector shows 3 visual options
- [ ] Review step shows summary
- [ ] "Create Campaign" button works
- [ ] Campaign is created in database
- [ ] Assets are generated (PDF + QR)
- [ ] User redirected to campaign detail page
- [ ] Loading states show during generation
- [ ] Error handling for failed creation

---

## Estimated Build Time

**6 hours**

## Priority

**Critical** - Core product functionality
