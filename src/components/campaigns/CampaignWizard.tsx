import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { GoalSelector } from './GoalSelector';
import { CopyEditor } from './CopyEditor';
import { LayoutSelector } from './LayoutSelector';
import { PDFPreview } from './PDFPreview';
import { useAuth } from '@/hooks/useAuth';

const STEPS = [
  { id: 'goal', name: 'Goal', icon: '🎯' },
  { id: 'copy', name: 'Copy', icon: '✍️' },
  { id: 'layout', name: 'Layout', icon: '🎨' },
  { id: 'preview', name: 'Generate', icon: '📄' },
];

export function CampaignWizard() {
  const { tenant } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [campaignData, setCampaignData] = useState({
    name: '',
    goal: '',
    headline: '',
    subheadline: '',
    cta: '',
    layout: 'modern' as 'classic' | 'modern' | 'minimal',
  });

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
          <span className="text-gray-400">&gt;●</span> Create Your Campaign
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
              vertical: (tenant as any)?.vertical_key || 'default',
              location: (tenant as any)?.name || '',
            }}
          />
        )}

        {currentStep === 2 && (
          <LayoutSelector
            selected={campaignData.layout}
            onSelect={(layout) => updateCampaignData({ layout: layout as any })}
          />
        )}

        {currentStep === 3 && (
          <PDFPreview
            campaignData={campaignData}
            tenantBranding={(tenant as any)?.branding}
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
