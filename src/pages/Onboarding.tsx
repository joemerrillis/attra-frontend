import { useState } from 'react';
import { WizardLayout } from '@/components/onboarding/WizardLayout';
import { VerticalSelector } from '@/components/onboarding/VerticalSelector';
import { BrandingForm } from '@/components/onboarding/BrandingForm';
import { LocationForm } from '@/components/onboarding/LocationForm';
import { CampaignGoalSelector } from '@/components/onboarding/CampaignGoalSelector';
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
  const [campaignGoal, setCampaignGoal] = useState('');

  const canProceed = () => {
    switch (step) {
      case 1:
        return vertical !== '';
      case 2:
        return tenantName.trim() !== '' && primaryColor !== '';
      case 3:
        return location.name.trim() !== '' && location.address.trim() !== '';
      case 4:
        return campaignGoal !== '';
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    }
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
      campaignGoal,
    });
  };

  return (
    <WizardLayout currentStep={step} totalSteps={4}>
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
        <LocationForm location={location} onLocationChange={setLocation} />
      )}

      {step === 4 && (
        <CampaignGoalSelector
          vertical={vertical}
          value={campaignGoal}
          onChange={setCampaignGoal}
        />
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between mt-8 pt-6 border-t">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={step === 1 || loading}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {step < 4 ? (
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
    </WizardLayout>
  );
}
