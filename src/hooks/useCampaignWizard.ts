import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { WizardData } from '@/types/campaign';
import { getSuggestion } from '@/lib/goal-suggestions';

export function useCampaignWizard() {
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<WizardData>(() => {
    // Initialize from URL params if coming from onboarding
    const goalParam = searchParams.get('goal');
    const verticalParam = searchParams.get('vertical');
    const fromOnboarding = searchParams.get('fromOnboarding') === 'true';

    if (fromOnboarding && goalParam) {
      const suggestion = getSuggestion(goalParam);

      if (suggestion) {
        return {
          // Pre-populate name and goal
          name: `${suggestion.label} Campaign`,
          goal: goalParam,

          // Pre-populate copy from suggestions
          copy: {
            headline: suggestion.defaultHeadline,
            subheadline: suggestion.defaultSubheadline,
            cta: suggestion.defaultCTA,
          },

          // Store suggestion for reference
          _goalSuggestion: suggestion,

          // Empty defaults for other fields
          selectedLocations: [],
          customizePerLocation: false,
          locationAssets: [],
        };
      }
    }

    // Default empty state if not from onboarding
    return {
      selectedLocations: [],
      customizePerLocation: false,
      locationAssets: [],
    };
  });

  const updateData = (updates: Partial<WizardData>) => {
    setWizardData(prev => ({ ...prev, ...updates }));
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1: // Name & Goal
        return !!(wizardData.name && wizardData.name.trim() && wizardData.goal);

      case 2: // Locations
        return wizardData.selectedLocations.length > 0;

      case 3: // Asset Type + Customize Toggle
        return !!wizardData.assetType;

      case 4: // Design (depends on mode)
        if (!wizardData.customizePerLocation) {
          // Shared mode: need URL, copy, and (layout OR background)
          return !!(
            wizardData.destinationUrl &&
            wizardData.copy?.headline &&
            wizardData.copy?.subheadline &&
            wizardData.copy?.cta &&
            (wizardData.layout || wizardData.background_id)
          );
        } else {
          // Per-location mode: need all locations configured
          return (
            wizardData.locationAssets?.length === wizardData.selectedLocations.length &&
            wizardData.locationAssets.every(asset =>
              asset.copy?.headline &&
              asset.copy?.subheadline &&
              asset.copy?.cta &&
              (asset.layout || asset.background_id)
            )
          );
        }

      case 5: // Preview - always allow proceeding
        return true;

      case 6: // Review
        return true;

      default:
        return false;
    }
  };

  const nextStep = () => {
    if (canProceed()) {
      setCurrentStep(prev => Math.min(prev + 1, 6));
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
