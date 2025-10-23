import { useState } from 'react';
import type { WizardData } from '@/types/campaign';

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
      case 1: // Name & Goal
        return !!(wizardData.name && wizardData.name.trim() && wizardData.goal);

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
