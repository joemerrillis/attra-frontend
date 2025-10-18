# 04_build_campaign_creation_system.md

## 🎯 Goal

Build a complete, production-ready campaign creation system that transforms digital planning into physical flyers. This is the **>●** (digital → physical) core of Attra - where tenants design branded marketing materials with AI assistance, generate print-ready PDFs with embedded QR codes, and prepare to capture real-world interest.

**Timeline:** 8-10 hours  
**Priority:** CRITICAL - Core product feature

---

## 📋 Prerequisites

- ✅ `00_build_pull_contracts.md` executed (schema contracts available)
- ✅ `02_build_auth_and_tenant_setup.md` completed (auth working)
- ✅ `03_build_onboarding_wizard.md` completed (tenants + locations exist)
- ✅ Backend has campaigns, AI, PDF, and QR endpoints deployed
- ✅ Supabase configured with Storage bucket for PDFs

---

## 🧭 User Journey

This file builds the complete flow:

1. **Select Goal** → What do you want this campaign to achieve?
2. **Write Copy** → AI-assisted headline/subheadline generation (optional)
3. **Choose Layout** → Classic, Modern, or Minimal flyer template
4. **Generate PDF** → Create print-ready flyer with embedded QR code
5. **Download** → Get your flyer and start distributing

**Result:** User has a professional, branded flyer ready to print and distribute physically.

---

## 🗂️ Complete File Structure

```
src/
├── pages/
│   └── campaigns/
│       ├── New.tsx                    (Main campaign creation page)
│       └── [id]/Edit.tsx              (Edit existing campaign)
├── components/
│   └── campaigns/
│       ├── CampaignWizard.tsx         (Stepper container)
│       ├── GoalSelector.tsx           (Step 1: Choose goal)
│       ├── CopyEditor.tsx             (Step 2: Write/refine copy)
│       ├── AIRefineCard.tsx           (AI suggestion preview)
│       ├── LayoutSelector.tsx         (Step 3: Choose template)
│       ├── PDFPreview.tsx             (Step 4: Preview & generate)
│       └── QRCodeDisplay.tsx          (Show generated QR code)
├── hooks/
│   ├── useCampaign.ts                 (Campaign CRUD operations)
│   ├── useAIRefine.ts                 (AI copy refinement)
│   ├── usePDFGeneration.ts            (PDF generation & status)
│   └── useQRLinks.ts                  (QR code data fetching)
├── lib/
│   ├── campaign-api.ts                (Type-safe campaign API client)
│   ├── ai-api.ts                      (Type-safe AI API client)
│   └── pdf-api.ts                     (Type-safe PDF API client)
└── types/
    └── api.d.ts                       (Generated from OpenAPI schema)
```

---

## ⚙️ Step 1: Pull Backend Schema Contracts

**Execute these commands in your frontend project root:**

```bash
# Fetch OpenAPI schema
curl https://api.attra.io/schema/openapi.json -o src/lib/contracts/openapi.json

# Fetch TypeScript types
curl https://api.attra.io/schema/types.d.ts -o src/types/backend.d.ts

# Fetch manifest for version tracking
curl https://api.attra.io/schema/manifest.json -o src/lib/contracts/manifest.json

# Generate typed API client from OpenAPI
pnpm dlx openapi-typescript src/lib/contracts/openapi.json -o src/types/api.d.ts
```

**Verify the files exist:**
```bash
ls -la src/types/api.d.ts
ls -la src/types/backend.d.ts
ls -la src/lib/contracts/openapi.json
```

---

## ⚙️ Step 2: Install Required Dependencies

```bash
pnpm add @tanstack/react-query
pnpm add react-hook-form zod @hookform/resolvers
pnpm add qrcode.react
pnpm add react-pdf pdfjs-dist
pnpm add date-fns
```

---

## ⚙️ Step 3: Create Type-Safe API Clients

### Campaign API Client

**File:** `src/lib/campaign-api.ts`

```typescript
import type { paths } from '@/types/api';

type CampaignsResponse = paths['/api/internal/campaigns']['get']['responses']['200']['content']['application/json'];
type CreateCampaignRequest = paths['/api/internal/campaigns']['post']['requestBody']['content']['application/json'];
type CampaignResponse = paths['/api/internal/campaigns/{id}']['get']['responses']['200']['content']['application/json'];

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('supabase.auth.token');
  
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const campaignApi = {
  async list(): Promise<CampaignsResponse> {
    return fetchWithAuth('/api/internal/campaigns');
  },

  async create(data: CreateCampaignRequest): Promise<CampaignResponse> {
    return fetchWithAuth('/api/internal/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getById(id: string): Promise<CampaignResponse> {
    return fetchWithAuth(`/api/internal/campaigns/${id}`);
  },

  async update(id: string, data: Partial<CreateCampaignRequest>): Promise<CampaignResponse> {
    return fetchWithAuth(`/api/internal/campaigns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<void> {
    return fetchWithAuth(`/api/internal/campaigns/${id}`, {
      method: 'DELETE',
    });
  },

  async getStats(id: string) {
    return fetchWithAuth(`/api/internal/campaigns/${id}/stats`);
  },
};
```

### AI API Client

**File:** `src/lib/ai-api.ts`

```typescript
import type { paths } from '@/types/api';

type GenerateCopyRequest = paths['/api/internal/ai/generate-copy']['post']['requestBody']['content']['application/json'];
type GenerateCopyResponse = paths['/api/internal/ai/generate-copy']['post']['responses']['200']['content']['application/json'];

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('supabase.auth.token');
  
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'AI request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const aiApi = {
  async generateCopy(data: GenerateCopyRequest): Promise<GenerateCopyResponse> {
    return fetchWithAuth('/api/internal/ai/generate-copy', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async checkRateLimit() {
    return fetchWithAuth('/api/internal/ai/rate-limit');
  },
};
```

### PDF API Client

**File:** `src/lib/pdf-api.ts`

```typescript
import type { paths } from '@/types/api';

type GeneratePDFRequest = paths['/api/internal/campaigns/{campaignId}/generate-pdf']['post']['requestBody']['content']['application/json'];
type GeneratePDFResponse = paths['/api/internal/campaigns/{campaignId}/generate-pdf']['post']['responses']['202']['content']['application/json'];

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('supabase.auth.token');
  
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'PDF generation failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const pdfApi = {
  async generatePDF(campaignId: string, data: GeneratePDFRequest): Promise<GeneratePDFResponse> {
    return fetchWithAuth(`/api/internal/campaigns/${campaignId}/generate-pdf`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getAssets(campaignId: string) {
    return fetchWithAuth(`/api/internal/campaigns/${campaignId}/assets`);
  },

  async getAssetStatus(assetId: string) {
    return fetchWithAuth(`/api/internal/assets/${assetId}/status`);
  },
};
```

---

## ⚙️ Step 4: Create React Hooks

### Campaign Hook

**File:** `src/hooks/useCampaign.ts`

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { campaignApi } from '@/lib/campaign-api';
import { useToast } from '@/components/ui/use-toast';

export interface CampaignData {
  name: string;
  description?: string;
  goal?: string;
  headline?: string;
  subheadline?: string;
  cta?: string;
  layout?: 'classic' | 'modern' | 'minimal';
  status?: 'draft' | 'active' | 'paused' | 'completed';
}

export function useCampaign(campaignId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => campaignApi.getById(campaignId!),
    enabled: !!campaignId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CampaignData) => campaignApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast({
        title: 'Campaign created',
        description: 'Your campaign has been created successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create campaign',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CampaignData> }) =>
      campaignApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast({
        title: 'Campaign updated',
        description: 'Your changes have been saved.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update campaign',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    campaign,
    isLoading,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
```

### AI Refine Hook

**File:** `src/hooks/useAIRefine.ts`

```typescript
import { useState } from 'react';
import { aiApi } from '@/lib/ai-api';
import { useToast } from '@/components/ui/use-toast';

interface RefineCopyParams {
  goal: string;
  vertical: string;
  location_name?: string;
  additional_context?: string;
}

interface CopyVariation {
  headline: string;
  subheadline: string;
}

export function useAIRefine() {
  const [isRefining, setIsRefining] = useState(false);
  const [variations, setVariations] = useState<CopyVariation[]>([]);
  const { toast } = useToast();

  const generate = async (params: RefineCopyParams) => {
    setIsRefining(true);
    try {
      const response = await aiApi.generateCopy(params);
      setVariations(response.variations || []);
      return response.variations;
    } catch (error: any) {
      toast({
        title: 'AI generation failed',
        description: error.message || 'Unable to generate copy variations. Please try again.',
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsRefining(false);
    }
  };

  const clear = () => {
    setVariations([]);
  };

  return {
    generate,
    clear,
    variations,
    isRefining,
  };
}
```

### PDF Generation Hook

**File:** `src/hooks/usePDFGeneration.ts`

```typescript
import { useMutation, useQuery } from '@tanstack/react-query';
import { pdfApi } from '@/lib/pdf-api';
import { useToast } from '@/components/ui/use-toast';

export function usePDFGeneration(campaignId?: string) {
  const { toast } = useToast();

  const { data: assets, refetch: refetchAssets } = useQuery({
    queryKey: ['campaign-assets', campaignId],
    queryFn: () => pdfApi.getAssets(campaignId!),
    enabled: !!campaignId,
  });

  const generateMutation = useMutation({
    mutationFn: ({ campaignId, layout }: { campaignId: string; layout: string }) =>
      pdfApi.generatePDF(campaignId, { layout }),
    onSuccess: () => {
      toast({
        title: 'PDF generation started',
        description: 'Your flyer is being generated. This may take a moment.',
      });
      // Poll for completion
      setTimeout(() => refetchAssets(), 3000);
    },
    onError: (error: Error) => {
      toast({
        title: 'PDF generation failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    assets: assets?.assets || [],
    generate: generateMutation.mutate,
    isGenerating: generateMutation.isPending,
  };
}
```

### QR Links Hook

**File:** `src/hooks/useQRLinks.ts`

```typescript
import { useQuery } from '@tanstack/react-query';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

async function fetchWithAuth(url: string) {
  const token = localStorage.getItem('supabase.auth.token');
  
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch QR links');
  }

  return response.json();
}

export function useQRLinks(campaignId?: string) {
  return useQuery({
    queryKey: ['qr-links', campaignId],
    queryFn: () => fetchWithAuth(`/api/internal/campaigns/${campaignId}/qr-links`),
    enabled: !!campaignId,
  });
}
```

---

## ⚙️ Step 5: Build Campaign Wizard Components

### Main Wizard Container

**File:** `src/components/campaigns/CampaignWizard.tsx`

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { GoalSelector } from './GoalSelector';
import { CopyEditor } from './CopyEditor';
import { LayoutSelector } from './LayoutSelector';
import { PDFPreview } from './PDFPreview';
import { useCampaign } from '@/hooks/useCampaign';
import { useAuth } from '@/hooks/useAuth';

const STEPS = [
  { id: 'goal', name: 'Goal', icon: '🎯' },
  { id: 'copy', name: 'Copy', icon: '✍️' },
  { id: 'layout', name: 'Layout', icon: '🎨' },
  { id: 'preview', name: 'Generate', icon: '📄' },
];

export function CampaignWizard() {
  const navigate = useNavigate();
  const { user, tenant } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [campaignData, setCampaignData] = useState({
    name: '',
    goal: '',
    headline: '',
    subheadline: '',
    cta: '',
    layout: 'modern' as 'classic' | 'modern' | 'minimal',
  });

  const { create, isCreating } = useCampaign();

  const canProceed = () => {
    switch (currentStep) {
      case 0: return !!campaignData.goal;
      case 1: return !!campaignData.headline && !!campaignData.subheadline;
      case 2: return !!campaignData.layout;
      default: return true;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateCampaignData = (updates: Partial<typeof campaignData>) => {
    setCampaignData(prev => ({ ...prev, ...updates }));
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with >● branding */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">
          <span className="text-gray-400">>●</span> Create Your Campaign
        </h1>
        <p className="text-muted-foreground">
          Transform your digital vision into physical flyers that capture real-world interest
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          {STEPS.map((step, index) => (
            <span
              key={step.id}
              className={
                index === currentStep
                  ? 'font-semibold text-primary'
                  : index < currentStep
                  ? 'text-green-600'
                  : 'text-muted-foreground'
              }
            >
              {step.icon} {step.name}
            </span>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Content */}
      <div className="min-h-[500px] py-8">
        {currentStep === 0 && (
          <GoalSelector
            selected={campaignData.goal}
            onSelect={(goal) => updateCampaignData({ goal })}
          />
        )}

        {currentStep === 1 && (
          <CopyEditor
            copy={{
              headline: campaignData.headline,
              subheadline: campaignData.subheadline,
              cta: campaignData.cta,
            }}
            onChange={(copy) => updateCampaignData(copy)}
            context={{
              goal: campaignData.goal,
              vertical: tenant?.vertical_key || 'default',
              location: tenant?.name || '',
            }}
          />
        )}

        {currentStep === 2 && (
          <LayoutSelector
            selected={campaignData.layout}
            onSelect={(layout) => updateCampaignData({ layout })}
          />
        )}

        {currentStep === 3 && (
          <PDFPreview
            campaignData={campaignData}
            tenantBranding={tenant?.branding}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {currentStep < STEPS.length - 1 ? (
          <Button onClick={handleNext} disabled={!canProceed()}>
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
```

### Goal Selector

**File:** `src/components/campaigns/GoalSelector.tsx`

```typescript
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Users, Calendar, TrendingUp } from 'lucide-react';

const CAMPAIGN_GOALS = [
  {
    id: 'new_clients',
    name: 'Get New Clients',
    description: 'Attract new customers to your business',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  {
    id: 'retention',
    name: 'Retain Existing Clients',
    description: 'Keep current customers engaged',
    icon: Target,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  {
    id: 'event',
    name: 'Promote an Event',
    description: 'Drive attendance to a specific event',
    icon: Calendar,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  {
    id: 'awareness',
    name: 'Build Awareness',
    description: 'Increase brand visibility in your area',
    icon: TrendingUp,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
];

interface GoalSelectorProps {
  selected: string | null;
  onSelect: (goalId: string) => void;
}

export function GoalSelector({ selected, onSelect }: GoalSelectorProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">What's your goal?</h2>
        <p className="text-muted-foreground">
          Choose what you want this campaign to achieve
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CAMPAIGN_GOALS.map((goal) => {
          const Icon = goal.icon;
          const isSelected = selected === goal.id;

          return (
            <Card
              key={goal.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected
                  ? `ring-2 ring-offset-2 ring-primary ${goal.borderColor} ${goal.bgColor}`
                  : 'hover:border-gray-400'
              }`}
              onClick={() => onSelect(goal.id)}
            >
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${goal.bgColor}`}>
                    <Icon className={`w-6 h-6 ${goal.color}`} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{goal.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {goal.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
```

### Copy Editor with AI

**File:** `src/components/campaigns/CopyEditor.tsx`

```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2 } from 'lucide-react';
import { AIRefineCard } from './AIRefineCard';
import { useAIRefine } from '@/hooks/useAIRefine';

interface CopyEditorProps {
  copy: {
    headline: string;
    subheadline: string;
    cta: string;
  };
  onChange: (copy: any) => void;
  context: {
    goal: string;
    vertical: string;
    location: string;
  };
}

export function CopyEditor({ copy, onChange, context }: CopyEditorProps) {
  const [localCopy, setLocalCopy] = useState(copy);
  const { generate, variations, isRefining, clear } = useAIRefine();
  const [showVariations, setShowVariations] = useState(false);

  const handleChange = (field: string, value: string) => {
    const updated = { ...localCopy, [field]: value };
    setLocalCopy(updated);
    onChange(updated);
  };

  const handleAIGenerate = async () => {
    const results = await generate({
      goal: context.goal,
      vertical: context.vertical,
      location_name: context.location,
    });
    if (results && results.length > 0) {
      setShowVariations(true);
    }
  };

  const handleSelectVariation = (variation: { headline: string; subheadline: string }) => {
    const updated = {
      ...localCopy,
      headline: variation.headline,
      subheadline: variation.subheadline,
    };
    setLocalCopy(updated);
    onChange(updated);
    setShowVariations(false);
    clear();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Write your flyer copy</h2>
        <p className="text-muted-foreground">
          Create compelling copy, or let AI help you get started
        </p>
      </div>

      {/* AI Variations Preview */}
      {showVariations && variations.length > 0 && (
        <AIRefineCard
          variations={variations}
          onSelect={handleSelectVariation}
          onDismiss={() => {
            setShowVariations(false);
            clear();
          }}
        />
      )}

      {/* Manual Input Fields */}
      <div className="space-y-4">
        {/* Headline */}
        <div className="space-y-2">
          <Label htmlFor="headline">Headline *</Label>
          <Input
            id="headline"
            value={localCopy.headline}
            onChange={(e) => handleChange('headline', e.target.value)}
            placeholder="Your dog deserves better walks"
            maxLength={60}
          />
          <p className="text-xs text-muted-foreground">
            {localCopy.headline.length}/60 characters
          </p>
        </div>

        {/* Subheadline */}
        <div className="space-y-2">
          <Label htmlFor="subheadline">Subheadline *</Label>
          <Textarea
            id="subheadline"
            value={localCopy.subheadline}
            onChange={(e) => handleChange('subheadline', e.target.value)}
            placeholder="Professional dog walkers trusted by 200+ families"
            maxLength={120}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            {localCopy.subheadline.length}/120 characters
          </p>
        </div>

        {/* Call to Action */}
        <div className="space-y-2">
          <Label htmlFor="cta">Call to Action</Label>
          <Input
            id="cta"
            value={localCopy.cta}
            onChange={(e) => handleChange('cta', e.target.value)}
            placeholder="Book your first walk free"
            maxLength={40}
          />
          <p className="text-xs text-muted-foreground">
            {localCopy.cta.length}/40 characters
          </p>
        </div>
      </div>

      {/* AI Generate Button */}
      {!showVariations && (
        <Button
          variant="outline"
          onClick={handleAIGenerate}
          disabled={isRefining}
          className="w-full"
        >
          {isRefining ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating variations...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate AI Variations (Optional)
            </>
          )}
        </Button>
      )}

      <p className="text-xs text-muted-foreground text-center">
        AI can help you get started, but you can always write your own copy
      </p>
    </div>
  );
}
```

### AI Refine Card

**File:** `src/components/campaigns/AIRefineCard.tsx`

```typescript
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, X } from 'lucide-react';

interface Variation {
  headline: string;
  subheadline: string;
}

interface AIRefineCardProps {
  variations: Variation[];
  onSelect: (variation: Variation) => void;
  onDismiss: () => void;
}

export function AIRefineCard({ variations, onSelect, onDismiss }: AIRefineCardProps) {
  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">AI-Generated Variations</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <CardDescription>
          Click any variation to use it, or dismiss to keep writing your own
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {variations.map((variation, index) => (
          <Card
            key={index}
            className="cursor-pointer hover:border-blue-400 transition-all hover:shadow-md bg-white"
            onClick={() => onSelect(variation)}
          >
            <CardContent className="pt-6">
              <p className="font-semibold text-lg mb-2">{variation.headline}</p>
              <p className="text-muted-foreground">{variation.subheadline}</p>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
```

### Layout Selector

**File:** `src/components/campaigns/LayoutSelector.tsx`

```typescript
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';

const LAYOUTS = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean, bold typography with plenty of whitespace',
    preview: '/previews/modern.svg',
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional layout with elegant serif fonts',
    preview: '/previews/classic.svg',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Simple and understated with maximum impact',
    preview: '/previews/minimal.svg',
  },
];

interface LayoutSelectorProps {
  selected: string;
  onSelect: (layoutId: string) => void;
}

export function LayoutSelector({ selected, onSelect }: LayoutSelectorProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Choose your flyer layout</h2>
        <p className="text-muted-foreground">
          Select a template that matches your brand personality
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {LAYOUTS.map((layout) => {
          const isSelected = selected === layout.id;

          return (
            <Card
              key={layout.id}
              className={`cursor-pointer transition-all hover:shadow-md relative ${
                isSelected
                  ? 'ring-2 ring-offset-2 ring-primary border-primary'
                  : 'hover:border-gray-400'
              }`}
              onClick={() => onSelect(layout.id)}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 bg-primary text-primary-foreground rounded-full p-1">
                  <Check className="w-4 h-4" />
                </div>
              )}

              <CardHeader>
                <CardTitle>{layout.name}</CardTitle>
                <CardDescription>{layout.description}</CardDescription>
              </CardHeader>

              <CardContent>
                <div className="aspect-[8.5/11] bg-gray-100 rounded border-2 border-gray-200 flex items-center justify-center">
                  <span className="text-muted-foreground">Preview</span>
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

### PDF Preview & Generation

**File:** `src/components/campaigns/PDFPreview.tsx`

```typescript
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Loader2, FileText } from 'lucide-react';
import { usePDFGeneration } from '@/hooks/usePDFGeneration';
import { useCampaign } from '@/hooks/useCampaign';
import { QRCodeDisplay } from './QRCodeDisplay';

interface PDFPreviewProps {
  campaignData: {
    name: string;
    goal: string;
    headline: string;
    subheadline: string;
    cta: string;
    layout: string;
  };
  tenantBranding?: any;
}

export function PDFPreview({ campaignData, tenantBranding }: PDFPreviewProps) {
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const { create, isCreating } = useCampaign();
  const { assets, generate, isGenerating } = usePDFGeneration(campaignId || undefined);

  // Create campaign on mount if not exists
  useEffect(() => {
    if (!campaignId) {
      create(
        {
          name: `${campaignData.goal} Campaign - ${new Date().toLocaleDateString()}`,
          description: `${campaignData.headline}`,
          goal: campaignData.goal,
          status: 'draft',
        },
        {
          onSuccess: (data: any) => {
            setCampaignId(data.id);
          },
        }
      );
    }
  }, []);

  const handleGenerate = () => {
    if (campaignId) {
      generate({
        campaignId,
        layout: campaignData.layout,
      });
    }
  };

  const hasPDF = assets && assets.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">
          <span className="text-gray-400">>●</span> Generate Your Flyer
        </h2>
        <p className="text-muted-foreground">
          Create your print-ready PDF with embedded QR code
        </p>
      </div>

      {/* Preview Card */}
      <Card>
        <CardHeader>
          <CardTitle>Flyer Preview</CardTitle>
          <CardDescription>
            Your branded flyer will include a QR code that tracks scans
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Visual Preview */}
          <div className="aspect-[8.5/11] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-8 text-center">
            {tenantBranding?.logo_url && (
              <img
                src={tenantBranding.logo_url}
                alt="Logo"
                className="h-16 mb-6"
              />
            )}
            <h3 className="text-2xl font-bold mb-3">{campaignData.headline}</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              {campaignData.subheadline}
            </p>
            <div className="bg-white p-4 rounded shadow-sm mb-4">
              <div className="w-32 h-32 bg-black" />
              <p className="text-xs text-muted-foreground mt-2">QR Code</p>
            </div>
            {campaignData.cta && (
              <p className="text-lg font-semibold text-primary">
                {campaignData.cta}
              </p>
            )}
          </div>

          {/* Generate/Download Actions */}
          <div className="space-y-3">
            {!hasPDF ? (
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || isCreating || !campaignId}
                className="w-full"
                size="lg"
              >
                {isGenerating || isCreating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5 mr-2" />
                    Generate Flyer PDF
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  className="w-full"
                  size="lg"
                >
                  <a
                    href={assets[0].file_url}
                    download={`${campaignData.name}.pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Download PDF
                  </a>
                </Button>

                <Button
                  variant="outline"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full"
                >
                  Regenerate PDF
                </Button>
              </>
            )}
          </div>

          {/* QR Code Info */}
          {hasPDF && campaignId && (
            <QRCodeDisplay campaignId={campaignId} />
          )}
        </CardContent>
      </Card>

      {/* Success Message */}
      {hasPDF && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <p className="text-green-800 font-medium">
              ✓ Your flyer is ready! Download and print to start capturing real-world interest.
            </p>
            <p className="text-green-700 text-sm mt-2">
              The embedded QR code will track every scan and help you measure your campaign's impact.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

### QR Code Display

**File:** `src/components/campaigns/QRCodeDisplay.tsx`

```typescript
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink } from 'lucide-react';
import { useQRLinks } from '@/hooks/useQRLinks';
import { useToast } from '@/components/ui/use-toast';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeDisplayProps {
  campaignId: string;
}

export function QRCodeDisplay({ campaignId }: QRCodeDisplayProps) {
  const { data: qrData } = useQRLinks(campaignId);
  const { toast } = useToast();

  if (!qrData?.qr_links || qrData.qr_links.length === 0) {
    return null;
  }

  const qrLink = qrData.qr_links[0];
  const shortUrl = `https://app.attra.io/q/${qrLink.id}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortUrl);
    toast({
      title: 'Copied!',
      description: 'Short link copied to clipboard',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-blue-600">●></span>
          Your QR Code
        </CardTitle>
        <CardDescription>
          This QR code is embedded in your PDF and will track every scan
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* QR Code */}
        <div className="flex justify-center">
          <div className="bg-white p-4 rounded border-2 border-gray-200">
            <QRCodeSVG
              value={shortUrl}
              size={200}
              level="H"
              includeMargin
            />
          </div>
        </div>

        {/* Short Link */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Short Link</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={shortUrl}
              readOnly
              className="flex-1 px-3 py-2 border rounded text-sm bg-gray-50"
            />
            <Button variant="outline" size="sm" onClick={copyToClipboard}>
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <a href={shortUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </div>

        {/* Destination URL */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Redirects To</label>
          <p className="text-sm text-muted-foreground break-all">
            {qrLink.redirect_url}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## ⚙️ Step 6: Create Main Campaign Page

**File:** `src/pages/campaigns/New.tsx`

```typescript
import { CampaignWizard } from '@/components/campaigns/CampaignWizard';

export default function NewCampaign() {
  return (
    <div className="container py-8">
      <CampaignWizard />
    </div>
  );
}
```

---

## ⚙️ Step 7: Add Routes to App

Update `src/App.tsx`:

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NewCampaign from '@/pages/campaigns/New';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Protected Campaign Routes */}
          <Route
            path="/campaigns/new"
            element={
              <ProtectedRoute>
                <NewCampaign />
              </ProtectedRoute>
            }
          />

          {/* ... other routes */}
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
```

---

## ✅ Acceptance Criteria

**Campaign Creation Flow:**
- [ ] Schema contracts pulled and types generated
- [ ] All API clients reference OpenAPI schema types
- [ ] Campaign wizard with 4 steps renders
- [ ] Goal selector with 4 options works
- [ ] Copy editor with character limits enforces validation
- [ ] AI generate button calls backend AI endpoint
- [ ] AI variations display in card with accept/reject
- [ ] Layout selector with 3 templates works
- [ ] PDF preview shows campaign data visually
- [ ] Generate PDF button creates campaign and triggers PDF job
- [ ] PDF downloads when ready
- [ ] QR code displays with short link and copy button
- [ ] >● branding appears in appropriate places
- [ ] All error states handled gracefully
- [ ] Loading states show during async operations
- [ ] Mobile responsive design works
- [ ] Navigation between steps validates data
- [ ] Back button works without losing data

**Type Safety:**
- [ ] Zero TypeScript errors
- [ ] All API calls use generated types
- [ ] No `any` types in code
- [ ] Autocomplete works in IDE for API responses

**User Experience:**
- [ ] Wizard flow is intuitive
- [ ] AI is clearly optional, not required
- [ ] Progress bar shows current position
- [ ] Character limits visible and enforced
- [ ] Success/error messages are clear
- [ ] PDF generation shows loading state
- [ ] Download works in all browsers

---

## 🧪 Testing Instructions

### Manual Testing Flow

1. **Start Development Server**
   ```bash
   pnpm run dev
   ```

2. **Test Schema Integration**
   - Verify `src/types/api.d.ts` exists
   - Open file and check for campaign types
   - Verify no TypeScript errors in console

3. **Test Campaign Wizard**
   - Navigate to `/campaigns/new`
   - Verify wizard loads with 4 steps
   - Verify >● branding in header

4. **Test Step 1: Goal Selection**
   - Click each goal option
   - Verify selection highlights
   - Verify "Next" button enables

5. **Test Step 2: Copy Editor**
   - Type headline (test 60 char limit)
   - Type subheadline (test 120 char limit)
   - Type CTA (test 40 char limit)
   - Click "Generate AI Variations"
   - Verify 3 variations appear
   - Click a variation to apply it
   - Verify fields update

6. **Test Step 3: Layout**
   - Select each layout
   - Verify selection highlights
   - Verify "Next" button enables

7. **Test Step 4: PDF Generation**
   - Click "Generate Flyer PDF"
   - Verify loading state
   - Wait 3-5 seconds
   - Verify PDF download button appears
   - Click download
   - Verify QR code section displays
   - Copy short link
   - Open short link in new tab

8. **Test Error Handling**
   - Disconnect internet
   - Try to generate AI copy
   - Verify error message displays
   - Reconnect internet
   - Try again

---

## 🛠 Troubleshooting

### TypeScript Errors About Missing Types

**Problem:** `Cannot find module '@/types/api'`

**Solution:**
```bash
# Regenerate types from schema
pnpm dlx openapi-typescript src/lib/contracts/openapi.json -o src/types/api.d.ts
```

### AI Generation Returns 400 Error

**Problem:** Backend rejects AI generation request

**Solutions:**
- Check `ANTHROPIC_API_KEY` is set in backend `.env`
- Verify backend AI endpoint is deployed
- Check rate limits: `GET /api/internal/ai/rate-limit`

### PDF Not Generating

**Problem:** PDF generation seems stuck

**Solutions:**
- Check backend logs for PDF worker errors
- Verify Supabase Storage bucket exists
- Check job queue status: `GET /api/internal/jobs`
- Verify campaign was created successfully

### QR Code Not Displaying

**Problem:** QR code section doesn't appear

**Solutions:**
- Verify campaign has QR links: `GET /api/internal/campaigns/{id}/qr-links`
- Check browser console for errors
- Verify QR link was created during PDF generation

---

## 📊 Performance Considerations

- **Schema Loading:** Types generated once at build time, zero runtime cost
- **API Calls:** React Query handles caching and deduplication
- **PDF Generation:** Async job queue prevents UI blocking
- **Image Loading:** QR codes generated client-side for instant display
- **Bundle Size:** ~150KB with tree-shaking enabled

---

## 🔒 Security Notes

- All API calls require JWT authentication
- Tenant isolation enforced by backend RLS
- File uploads validated server-side
- QR codes use UUIDs, not sequential IDs
- Short links are cryptographically random

---

## 🎨 Design Notes

**>● Branding Usage:**
- Main heading: "Create Your Campaign"
- PDF preview: "Generate Your Flyer"
- Success messages about physical distribution

**Color Scheme:**
- Primary: Blue (#3B82F6)
- Success: Green (#10B981)
- Warning: Orange (#F59E0B)
- Neutral: Gray (#6B7280)

**Typography:**
- Headlines: Bold, 2xl-4xl
- Body: Regular, base
- Labels: Medium, sm
- Descriptions: Muted, sm

---

## 🔜 Future Enhancements

These are NOT required for MVP but noted for future iterations:

1. **Multi-location PDF Generation**
   - Generate PDFs for multiple locations at once
   - Batch download as ZIP file

2. **Template Customization**
   - Upload custom fonts
   - Adjust layout spacing
   - Add background images

3. **Campaign Analytics Preview**
   - Show projected reach
   - Display similar campaign performance
   - Suggest optimal distribution locations

4. **Collaboration Features**
   - Share draft for team review
   - Comment on copy changes
   - Approval workflows

---

## ✅ Completion Checklist

Before marking this file as complete:

- [ ] All code files created with complete implementations
- [ ] Schema contracts successfully pulled
- [ ] TypeScript types generated without errors
- [ ] All components render without errors
- [ ] Campaign creation flow works end-to-end
- [ ] AI generation tested and functional
- [ ] PDF generation creates downloadable file
- [ ] QR code displays with working short link
- [ ] Mobile responsive layout verified
- [ ] All acceptance criteria met
- [ ] Manual testing completed
- [ ] No console errors or warnings
- [ ] Git commit made with descriptive message

---

**File Complete:** This is a production-ready, executable command file.  
**Claude Code:** Execute each step in sequence. Do not skip steps.  
**Result:** Fully functional campaign creation system with AI and PDF generation.
