import { useState } from 'react';
import { WizardLayout } from '@/components/onboarding/WizardLayout';
import { VerticalSelector } from '@/components/onboarding/VerticalSelector';
import { BrandingForm } from '@/components/onboarding/BrandingForm';
import { BrandMomentForm } from '@/components/onboarding/BrandMomentForm';
import { LocationForm } from '@/components/onboarding/LocationForm';
import { MarketingGoalSelector } from '@/components/onboarding/MarketingGoalSelector';
import { useOnboarding } from '@/hooks/useOnboarding';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowRight, ArrowLeft } from 'lucide-react';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const { completeOnboarding, loading, error } = useOnboarding();

  // Form state
  const [vertical, setVertical] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [primaryColor, setPrimaryColor] = useState('#3B82F6');
  const [location, setLocation] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    latitude: null as number | null,
    longitude: null as number | null,
  });
  const [marketingGoal, setMarketingGoal] = useState('');

  const canProceed = () => {
    switch (step) {
      case 1:
        return vertical !== '';
      case 2:
        return tenantName.trim() !== '' && primaryColor !== '';
      case 3:
        return true; // Brand Moment is optional - always can proceed
      case 4:
        return location.name.trim() !== '' && location.address.trim() !== '';
      case 5:
        return marketingGoal !== '';
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    }
  };

  const handleSkipBrandMoment = () => {
    // Skip Step 3 (Brand Moment) and go directly to Step 4 (Location)
    setStep(4);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    await completeOnboarding({
      vertical,
      tenantName,
      logoFile,
      primaryColor,
      location,
      campaignGoal: marketingGoal,
    });
  };

  return (
    <WizardLayout currentStep={step} totalSteps={5}>
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step content */}
      {step === 1 && (
        <VerticalSelector value={vertical} onChange={setVertical} />
      )}

      {step === 2 && (
        <BrandingForm
          tenantName={tenantName}
          onTenantNameChange={setTenantName}
          logoFile={logoFile}
          onLogoChange={setLogoFile}
          primaryColor={primaryColor}
          onColorChange={setPrimaryColor}
        />
      )}

      {step === 3 && (
        <BrandMomentForm
          onComplete={handleNext}
          onSkip={handleSkipBrandMoment}
        />
      )}

      {step === 4 && (
        <LocationForm location={location} onLocationChange={setLocation} />
      )}

      {step === 5 && (
        <MarketingGoalSelector
          vertical={vertical}
          value={marketingGoal}
          onChange={setMarketingGoal}
        />
      )}

      {/* Navigation buttons - Hidden for Step 3 (Brand Moment has its own controls) */}
      {step !== 3 && (
        <div className="flex justify-between mt-8 pt-6 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1 || loading}
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
              onClick={handleComplete}
              disabled={!canProceed() || loading}
            >
              {loading ? 'Setting up...' : 'Complete Setup'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      )}
    </WizardLayout>
  );
}