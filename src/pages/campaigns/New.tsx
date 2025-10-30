import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCampaignWizard } from '@/hooks/useCampaignWizard';
import { useCampaignDraft } from '@/hooks/useCampaignDraft';
import { campaignApi } from '@/lib/campaign-api';
import { getPreferences } from '@/lib/api/preferences';
import { Step1Goal } from '@/components/campaigns/wizard/Step1Goal';
import { Step2Locations } from '@/components/campaigns/wizard/Step2Locations';
import { Step3AssetType } from '@/components/campaigns/wizard/Step3AssetType';
import { Step4DesignShared } from '@/components/campaigns/wizard/Step4DesignShared';
import { Step4DesignPerLocation } from '@/components/campaigns/wizard/Step4DesignPerLocation';
import { Step4_5Preview } from '@/components/campaigns/wizard/Step4_5Preview';
import { Step5Review } from '@/components/campaigns/wizard/Step5Review';
import type { GenerateAssetsRequest } from '@/types/campaign';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const STEPS = [
  { number: 1, label: 'Goal' },
  { number: 2, label: 'Locations' },
  { number: 3, label: 'Asset Type' },
  { number: 4, label: 'Design' },
  { number: 5, label: 'Preview' },
  { number: 6, label: 'Review' }
];

export default function NewCampaign() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const { currentStep, wizardData, updateData, canProceed, nextStep, prevStep, restoreFromDraft } = useCampaignWizard();
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);

  // Draft functionality
  const { loadDraft, saveDraft, deleteDraft, isSaving, lastSaved } = useCampaignDraft();
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [draftToResume, setDraftToResume] = useState<any>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Show welcome toast when coming from onboarding
  useEffect(() => {
    const fromOnboarding = searchParams.get('fromOnboarding') === 'true';
    if (fromOnboarding && wizardData._goalSuggestion) {
      toast({
        title: "Welcome! We've started your campaign",
        description: `Pre-filled with copy for "${wizardData._goalSuggestion.label}". Feel free to customize!`,
      });
    }
  }, []); // Only run once on mount

  // Check for existing draft on mount
  useEffect(() => {
    const checkForDraft = async () => {
      const draft = await loadDraft();

      if (draft && draft.currentStep) {
        // Draft exists - ask user if they want to resume
        setDraftToResume(draft);
        setShowResumeDialog(true);
      }
    };

    checkForDraft();
  }, [loadDraft]);

  // Create campaign mutation
  const { mutate: createCampaign, isPending: isCreatingCampaign } = useMutation({
    mutationFn: () => campaignApi.create({
      name: wizardData.name || `${wizardData.goal} Campaign - ${new Date().toLocaleDateString()}`,
      goal: wizardData.goal!,
      description: wizardData.description
    }),
    onSuccess: (campaign: any) => {
      // Handle both response formats: { campaign: { id } } or { id }
      const newCampaignId = campaign?.campaign?.id || campaign?.id;
      setCampaignId(newCampaignId);
      toast({ title: 'Campaign created!', description: 'Moving to next step' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message || 'Failed to create campaign', variant: 'destructive' });
    }
  });

  // Generate assets mutation
  const { mutate: generateAssets, isPending: isGenerating } = useMutation({
    mutationFn: async () => {
      if (!campaignId) throw new Error('Campaign ID not found');

      // Check if this is the first campaign
      try {
        const prefs = await getPreferences();
        const isFirstCampaign = !prefs?.first_campaign_created;

        // If first campaign, set celebration flag
        if (isFirstCampaign) {
          localStorage.setItem(`celebrate_campaign_${campaignId}`, 'true');
          console.log('[Campaign Wizard] First campaign detected - celebration flag set');
        }
      } catch (error) {
        console.error('[Campaign Wizard] Failed to check preferences:', error);
        // Non-blocking - continue with asset generation
      }

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
        request.background_id = wizardData.background_id;
      }

      return campaignApi.generateAssets(campaignId, request);
    },
    onSuccess: (response) => {
      toast({ title: 'Assets queued!', description: `${response.assets_created} asset(s) queued for generation` });
      navigate(`/campaigns/${campaignId}`);
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message || 'Failed to generate assets', variant: 'destructive' });
    }
  });

  // Create campaign when moving from step 1 to 2
  useEffect(() => {
    if (currentStep === 2 && !campaignId && !isCreatingCampaign && wizardData.goal) {
      createCampaign();
    }
  }, [currentStep, campaignId, isCreatingCampaign, wizardData.goal]);

  // Mark as having unsaved changes when wizard data changes
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [wizardData, currentStep]);

  // Auto-save: Save draft every 30 seconds if there are changes
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set new timer for 30 seconds
    autoSaveTimerRef.current = setTimeout(async () => {
      const wizardState = {
        currentStep,
        ...wizardData,
      };

      const success = await saveDraft(wizardState);
      if (success) {
        setHasUnsavedChanges(false);
      }
    }, 30000); // 30 seconds

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [wizardData, currentStep, hasUnsavedChanges, saveDraft]);

  // Resume draft handler
  const handleResumeDraft = () => {
    if (draftToResume) {
      const { currentStep: draftStep, ...draftData } = draftToResume;
      restoreFromDraft(draftData, draftStep || 1);
      setShowResumeDialog(false);
      toast({
        title: 'Draft restored',
        description: 'Continuing where you left off',
      });
    }
  };

  // Start fresh handler (delete old draft)
  const handleStartFresh = async () => {
    await deleteDraft();
    setShowResumeDialog(false);
    toast({
      title: 'Starting fresh',
      description: 'Old draft deleted',
    });
  };

  // Manual save handler
  const handleManualSave = async () => {
    const wizardState = {
      currentStep,
      ...wizardData,
    };

    const success = await saveDraft(wizardState);
    if (success) {
      setHasUnsavedChanges(false);
      toast({
        title: 'Draft saved',
        description: 'Your progress has been saved',
      });
    } else {
      toast({
        title: 'Failed to save',
        description: 'Could not save your draft',
        variant: 'destructive',
      });
    }
  };

  const handleNext = () => {
    nextStep();
  };

  const handleBack = () => {
    if (currentStep === 1) {
      // On first step - check if there are unsaved changes
      const hasChanges = !!(wizardData.name || wizardData.description || wizardData.goal);

      if (hasChanges) {
        // Show confirmation dialog
        setShowExitConfirmation(true);
      } else {
        // No changes, just exit
        navigate('/campaigns');
      }
    } else {
      // On other steps, go to previous step
      prevStep();
    }
  };

  const handleConfirmExit = () => {
    setShowExitConfirmation(false);
    navigate('/campaigns');
  };

  const handleFinish = async () => {
    // Generate assets first
    generateAssets();

    // Delete draft after successful campaign creation
    await deleteDraft();
  };

  const progress = (currentStep / STEPS.length) * 100;

  // Helper function to format time ago
  const formatTimeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="container max-w-4xl py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              <span className="text-muted-foreground">&gt;●</span> Create Campaign
            </h1>
            <p className="text-muted-foreground">
              Transform digital planning into physical flyers
            </p>
          </div>
          {/* Save Status Indicator */}
          <div className="text-sm text-muted-foreground">
            {isSaving && (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </div>
            )}
            {!isSaving && lastSaved && (
              <span>Last saved {formatTimeAgo(lastSaved)}</span>
            )}
          </div>
        </div>
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
            name={wizardData.name}
            onNameChange={(name) => updateData({ name })}
            description={wizardData.description}
            onDescriptionChange={(description) => updateData({ description })}
            goal={wizardData.goal}
            onGoalChange={(goal) => updateData({ goal })}
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
            layout={wizardData.layout}
            onLayoutChange={(layout) => updateData({ layout })}
            backgroundId={wizardData.background_id}
            onBackgroundIdChange={(background_id) => updateData({ background_id })}
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
          <Step4_5Preview
            copy={!wizardData.customizePerLocation ? wizardData.copy : undefined}
            layout={!wizardData.customizePerLocation ? wizardData.layout : undefined}
            backgroundId={!wizardData.customizePerLocation ? wizardData.background_id : undefined}
            locationAssets={wizardData.customizePerLocation ? wizardData.locationAssets : undefined}
            onBack={prevStep}
            onEditCopy={() => {
              prevStep();
            }}
            onChangeBackground={() => {
              prevStep();
            }}
            onApprove={nextStep}
          />
        )}

        {currentStep === 6 && (
          <Step5Review data={wizardData} />
        )}
      </div>

      {/* Navigation (hidden for step 5 which has its own controls) */}
      {currentStep !== 5 && (
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={isGenerating || isCreatingCampaign}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex gap-2">
            {/* Save Draft Button */}
            <Button
              variant="outline"
              onClick={handleManualSave}
              disabled={isSaving || isGenerating || isCreatingCampaign}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Draft
                </>
              )}
            </Button>

            {currentStep < 6 ? (
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
      )}

      {/* Exit Confirmation Dialog */}
      <AlertDialog open={showExitConfirmation} onOpenChange={setShowExitConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave campaign creation?</AlertDialogTitle>
            <AlertDialogDescription>
              Your progress will be lost. Are you sure you want to leave?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmExit}>Leave</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Resume Draft Dialog */}
      <AlertDialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Continue where you left off?</AlertDialogTitle>
            <AlertDialogDescription>
              You have a saved campaign draft. Would you like to continue or start fresh?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleStartFresh}>
              Start Fresh
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleResumeDraft}>
              Continue Draft
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
