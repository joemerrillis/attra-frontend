# 04_build_campaign_wizard.md

## 🎯 Goal

Create a campaign wizard that guides users through creating a flyer campaign: choose goal, write copy (with optional AI refinement), select layout, preview PDF, and generate the final flyer.

---

## 📋 Prerequisites

- ✅ `02_build_auth_and_tenant_setup.md` completed (auth working)
- ✅ `03_build_onboarding_wizard.md` completed (locations exist)
- ✅ Backend `06.5_ai_copy_refinement.md` completed (AI endpoint available)
- ✅ Backend `09_core_entity_routes.md` completed (campaigns API working)

---

## 🗂️ Files Created

```
src/pages/campaigns/
 └─ New.tsx

src/components/campaigns/
 ├─ CampaignWizard.tsx
 ├─ GoalSelector.tsx
 ├─ CopyEditor.tsx           ← Main copy input with optional AI refine
 ├─ LayoutSelector.tsx
 └─ PDFPreview.tsx

src/hooks/
 ├─ useCampaign.ts
 └─ useAIRefine.ts           ← New hook for AI refinement

src/lib/
 └─ ai.ts                    ← AI API calls
```

---

## ⚙️ Step 1: Create Campaign Goal Selector

Create `src/components/campaigns/GoalSelector.tsx`:

```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Users, Calendar, TrendingUp } from 'lucide-react';

const CAMPAIGN_GOALS = [
  {
    id: 'new_clients',
    name: 'Get New Clients',
    description: 'Attract new customers to your business',
    icon: Users,
    color: 'text-blue-600'
  },
  {
    id: 'retention',
    name: 'Retain Existing Clients',
    description: 'Keep current customers engaged',
    icon: Target,
    color: 'text-green-600'
  },
  {
    id: 'event',
    name: 'Promote an Event',
    description: 'Drive attendance to a specific event',
    icon: Calendar,
    color: 'text-purple-600'
  },
  {
    id: 'awareness',
    name: 'Build Awareness',
    description: 'Increase brand visibility in your area',
    icon: TrendingUp,
    color: 'text-orange-600'
  }
];

interface GoalSelectorProps {
  selected: string | null;
  onSelect: (goalId: string) => void;
}

export function GoalSelector({ selected, onSelect }: GoalSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">What's your goal?</h2>
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
              className={`cursor-pointer transition-all hover:border-primary ${
                isSelected ? 'border-primary ring-2 ring-primary' : ''
              }`}
              onClick={() => onSelect(goal.id)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Icon className={`w-6 h-6 ${goal.color}`} />
                  <CardTitle className="text-lg">{goal.name}</CardTitle>
                </div>
                <CardDescription>{goal.description}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
```

---

## ⚙️ Step 2: Create Copy Editor with Optional AI Refine

Create `src/components/campaigns/CopyEditor.tsx`:

```tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Check, X, Loader2 } from 'lucide-react';
import { useAIRefine } from '@/hooks/useAIRefine';

interface CopyEditorProps {
  copy: {
    headline: string;
    subheadline: string;
    cta: string;
  };
  onChange: (copy: any) => void;
  context: {
    vertical: string;
    location: string;
    goal: string;
  };
}

export function CopyEditor({ copy, onChange, context }: CopyEditorProps) {
  const [localCopy, setLocalCopy] = useState(copy);
  const { refine, isRefining, refinedCopy, clearRefinement } = useAIRefine();

  const handleChange = (field: string, value: string) => {
    const updated = { ...localCopy, [field]: value };
    setLocalCopy(updated);
    onChange(updated);
  };

  const handleRefine = async () => {
    await refine({
      current_copy: localCopy,
      context
    });
  };

  const handleAcceptRefinement = () => {
    if (refinedCopy) {
      setLocalCopy(refinedCopy.refined_copy);
      onChange(refinedCopy.refined_copy);
      clearRefinement();
    }
  };

  const handleRejectRefinement = () => {
    clearRefinement();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Write your flyer copy</h2>
        <p className="text-muted-foreground">
          Create compelling copy that speaks to your audience
        </p>
      </div>

      {/* Headline */}
      <div className="space-y-2">
        <Label htmlFor="headline">Headline</Label>
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
        <Label htmlFor="subheadline">Subheadline</Label>
        <Textarea
          id="subheadline"
          value={localCopy.subheadline}
          onChange={(e) => handleChange('subheadline', e.target.value)}
          placeholder="Professional dog walkers trusted by 200+ families in your building"
          maxLength={120}
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          {localCopy.subheadline.length}/120 characters
        </p>
      </div>

      {/* CTA */}
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

      {/* AI Refine Button */}
      {!refinedCopy && (
        <Button
          variant="outline"
          onClick={handleRefine}
          disabled={isRefining || !localCopy.headline}
          className="w-full"
        >
          {isRefining ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Refining...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              AI Refine (Optional)
            </>
          )}
        </Button>
      )}

      {/* Refinement Preview */}
      {refinedCopy && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI Suggestions
            </CardTitle>
            <CardDescription>
              Review these improvements and decide whether to use them
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Refined Headline */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Refined Headline</p>
              <p className="font-semibold">{refinedCopy.refined_copy.headline}</p>
            </div>

            {/* Refined Subheadline */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Refined Subheadline</p>
              <p className="text-sm">{refinedCopy.refined_copy.subheadline}</p>
            </div>

            {/* Refined CTA */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Refined CTA</p>
              <p className="text-sm font-medium">{refinedCopy.refined_copy.cta}</p>
            </div>

            {/* Reasoning */}
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground italic">
                {refinedCopy.reasoning}
              </p>
            </div>

            {/* Accept/Reject Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleAcceptRefinement}
                className="flex-1"
              >
                <Check className="w-4 h-4 mr-2" />
                Use This
              </Button>
              <Button
                variant="outline"
                onClick={handleRejectRefinement}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Keep Mine
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

---

## ⚙️ Step 3: Create AI Refine Hook

Create `src/hooks/useAIRefine.ts`:

```typescript
import { useState } from 'react';
import { refineCopy } from '@/lib/ai';
import { useToast } from '@/components/ui/use-toast';

interface RefineCopyParams {
  current_copy: {
    headline: string;
    subheadline: string;
    cta: string;
  };
  context: {
    vertical: string;
    location: string;
    goal: string;
  };
}

export function useAIRefine() {
  const [isRefining, setIsRefining] = useState(false);
  const [refinedCopy, setRefinedCopy] = useState<any>(null);
  const { toast } = useToast();

  const refine = async (params: RefineCopyParams) => {
    setIsRefining(true);
    
    try {
      const result = await refineCopy(params);
      
      if (result.error) {
        toast({
          title: 'Refinement failed',
          description: result.details || 'Unable to refine copy. Please try again.',
          variant: 'destructive'
        });
        return;
      }
      
      setRefinedCopy(result);
    } catch (error) {
      toast({
        title: 'Refinement failed',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsRefining(false);
    }
  };

  const clearRefinement = () => {
    setRefinedCopy(null);
  };

  return {
    refine,
    isRefining,
    refinedCopy,
    clearRefinement
  };
}
```

---

## ⚙️ Step 4: Create AI API Client

Create `src/lib/ai.ts`:

```typescript
import { supabase } from './supabase';

interface RefineCopyParams {
  current_copy: {
    headline: string;
    subheadline: string;
    cta: string;
  };
  context: {
    vertical: string;
    location: string;
    goal: string;
    campaign_id?: string;
  };
}

export async function refineCopy(params: RefineCopyParams) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/internal/ai/refine-copy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    const error = await response.json();
    return { error: error.error, details: error.details };
  }

  return await response.json();
}

export async function getAIRateLimit() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/internal/ai/rate-limit`, {
    headers: {
      'Authorization': `Bearer ${session.access_token}`
    }
  });

  return await response.json();
}
```

---

## ⚙️ Step 5: Create Layout Selector

Create `src/components/campaigns/LayoutSelector.tsx`:

```tsx
import { Card, CardContent } from '@/components/ui/card';
import { Check } from 'lucide-react';

const LAYOUTS = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional flyer with centered text',
    preview: '/layouts/classic-preview.png'
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean design with bold typography',
    preview: '/layouts/modern-preview.png'
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Simple and elegant with lots of whitespace',
    preview: '/layouts/minimal-preview.png'
  }
];

interface LayoutSelectorProps {
  selected: string;
  onSelect: (layoutId: string) => void;
}

export function LayoutSelector({ selected, onSelect }: LayoutSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Choose your layout</h2>
        <p className="text-muted-foreground">
          Select a design that fits your brand
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {LAYOUTS.map((layout) => {
          const isSelected = selected === layout.id;

          return (
            <Card
              key={layout.id}
              className={`cursor-pointer transition-all hover:border-primary ${
                isSelected ? 'border-primary ring-2 ring-primary' : ''
              }`}
              onClick={() => onSelect(layout.id)}
            >
              <CardContent className="p-4">
                <div className="aspect-[8.5/11] bg-muted rounded-md mb-3 relative overflow-hidden">
                  {/* Layout preview image would go here */}
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    {layout.name} Layout
                  </div>
                  
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <h3 className="font-semibold mb-1">{layout.name}</h3>
                <p className="text-sm text-muted-foreground">{layout.description}</p>
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

## ⚙️ Step 6: Create PDF Preview Component

Create `src/components/campaigns/PDFPreview.tsx`:

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Eye } from 'lucide-react';

interface PDFPreviewProps {
  pdfUrl: string | null;
  isGenerating: boolean;
  campaign: any;
  onGenerate: () => void;
}

export function PDFPreview({ pdfUrl, isGenerating, campaign, onGenerate }: PDFPreviewProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Preview & Generate</h2>
        <p className="text-muted-foreground">
          Review your flyer before generating the final PDF
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          {/* Preview Area */}
          <div className="aspect-[8.5/11] bg-muted rounded-md mb-4 flex items-center justify-center">
            {pdfUrl ? (
              <iframe
                src={pdfUrl}
                className="w-full h-full rounded-md"
                title="PDF Preview"
              />
            ) : (
              <div className="text-center space-y-4">
                <Eye className="w-12 h-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="font-medium">Ready to generate your flyer</p>
                  <p className="text-sm text-muted-foreground">
                    Click below to create your PDF
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {!pdfUrl ? (
              <Button
                onClick={onGenerate}
                disabled={isGenerating}
                className="flex-1"
              >
                {isGenerating ? 'Generating...' : 'Generate PDF'}
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={onGenerate}
                  disabled={isGenerating}
                  className="flex-1"
                >
                  Regenerate
                </Button>
                <Button
                  asChild
                  className="flex-1"
                >
                  <a href={pdfUrl} download>
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </a>
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## ⚙️ Step 7: Create Campaign Wizard Container

Create `src/components/campaigns/CampaignWizard.tsx`:

```tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { GoalSelector } from './GoalSelector';
import { CopyEditor } from './CopyEditor';
import { LayoutSelector } from './LayoutSelector';
import { PDFPreview } from './PDFPreview';
import { useCampaign } from '@/hooks/useCampaign';

const STEPS = [
  { id: 'goal', name: 'Goal' },
  { id: 'copy', name: 'Copy' },
  { id: 'layout', name: 'Layout' },
  { id: 'preview', name: 'Preview' }
];

export function CampaignWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const {
    campaign,
    updateCampaign,
    generatePDF,
    pdfUrl,
    isGenerating
  } = useCampaign();

  const canProceed = () => {
    switch (currentStep) {
      case 0: return !!campaign.goal;
      case 1: return !!campaign.copy?.headline;
      case 2: return !!campaign.layout;
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

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
                  ? 'text-muted-foreground'
                  : 'text-muted-foreground/50'
              }
            >
              {step.name}
            </span>
          ))}
        </div>
        <Progress value={progress} />
      </div>

      {/* Step Content */}
      <div className="min-h-[500px]">
        {currentStep === 0 && (
          <GoalSelector
            selected={campaign.goal}
            onSelect={(goal) => updateCampaign({ goal })}
          />
        )}

        {currentStep === 1 && (
          <CopyEditor
            copy={campaign.copy || { headline: '', subheadline: '', cta: '' }}
            onChange={(copy) => updateCampaign({ copy })}
            context={{
              vertical: campaign.vertical || 'default',
              location: campaign.location?.name || '',
              goal: campaign.goal || ''
            }}
          />
        )}

        {currentStep === 2 && (
          <LayoutSelector
            selected={campaign.layout || 'classic'}
            onSelect={(layout) => updateCampaign({ layout })}
          />
        )}

        {currentStep === 3 && (
          <PDFPreview
            pdfUrl={pdfUrl}
            isGenerating={isGenerating}
            campaign={campaign}
            onGenerate={generatePDF}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Button
          onClick={handleNext}
          disabled={!canProceed() || currentStep === STEPS.length - 1}
        >
          Next
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
```

---

## ⚙️ Step 8: Create Campaign Hook

Create `src/hooks/useCampaign.ts`:

```typescript
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

export function useCampaign() {
  const [campaign, setCampaign] = useState<any>({});
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const updateCampaign = (updates: any) => {
    setCampaign((prev: any) => ({ ...prev, ...updates }));
  };

  const generatePDF = async () => {
    setIsGenerating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      // First, create/update campaign
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/internal/campaigns`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            name: campaign.copy.headline,
            goal: campaign.goal,
            copy: campaign.copy,
            layout: campaign.layout
          })
        }
      );

      if (!response.ok) throw new Error('Failed to create campaign');

      const createdCampaign = await response.json();

      // Then trigger PDF generation
      const pdfResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/api/internal/campaigns/${createdCampaign.id}/generate-flyer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      );

      if (!pdfResponse.ok) throw new Error('Failed to generate PDF');

      const result = await pdfResponse.json();

      // Poll for PDF completion (placeholder - implement actual polling)
      toast({
        title: 'PDF Generating',
        description: 'Your flyer is being created. This may take a moment.',
      });

      // Simulate PDF generation completion
      setTimeout(() => {
        setPdfUrl('/sample-flyer.pdf'); // Replace with actual PDF URL from job
        toast({
          title: 'PDF Ready',
          description: 'Your flyer has been generated successfully!',
        });
      }, 3000);

    } catch (error) {
      toast({
        title: 'Generation failed',
        description: 'Unable to generate PDF. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    campaign,
    updateCampaign,
    generatePDF,
    pdfUrl,
    isGenerating
  };
}
```

---

## ⚙️ Step 9: Create Campaign New Page

Create `src/pages/campaigns/New.tsx`:

```tsx
import { CampaignWizard } from '@/components/campaigns/CampaignWizard';

export default function NewCampaign() {
  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create New Campaign</h1>
        <p className="text-muted-foreground">
          Design a flyer to promote your business
        </p>
      </div>

      <CampaignWizard />
    </div>
  );
}
```

---

## ⚙️ Step 10: Add Route

Update `src/App.tsx`:

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NewCampaign from './pages/campaigns/New';

// ... other imports

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ... other routes */}
        <Route path="/campaigns/new" element={<NewCampaign />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## ✅ Completion Criteria

- ✅ Campaign wizard with 4 steps (Goal, Copy, Layout, Preview)
- ✅ Goal selector with 4 campaign types
- ✅ Copy editor with manual input fields
- ✅ Optional AI refine button integrated
- ✅ AI refinement preview card with accept/reject
- ✅ Layout selector with 3 templates
- ✅ PDF preview component
- ✅ Progress bar showing current step
- ✅ Navigation between steps
- ✅ Form validation before proceeding
- ✅ Character limits enforced
- ✅ Error handling for AI failures
- ✅ Rate limit aware (shows errors gracefully)
- ✅ Responsive design for mobile

---

## 🔜 Next Steps

1. Implement actual PDF generation polling (replace setTimeout)
2. Add PDF job status checking
3. Create layout templates (Classic/Modern/Minimal)
4. Add campaign save/draft functionality
5. Proceed to `06_build_pdf_generation_service.md` for backend PDF rendering

---

## 🛠 Troubleshooting

### AI refine button doesn't work:
- Check that backend `06.5_ai_copy_refinement.md` is completed
- Verify `VITE_API_URL` is set correctly
- Check browser console for errors

### Rate limit errors:
- Check `/api/internal/ai/rate-limit` endpoint
- Wait for rate limit window to reset
- Adjust limits in backend if needed

### PDF not generating:
- Verify campaign is created successfully
- Check backend job queue is running
- Look for errors in backend logs

---

**Note for Claude Code:** The AI refinement is completely optional. Users can write their own copy and skip the AI button entirely. The campaign wizard should work perfectly fine without AI - it's just an enhancement feature.
