import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UpgradePromptProps {
  feature?: string;
  featureName?: string;
  featureDescription?: string;
  requiredPlan?: string;
  upgradeUrl?: string;
  open?: boolean;
  onClose?: () => void;
}

export function UpgradePrompt({
  feature,
  featureName,
  featureDescription,
  requiredPlan,
  upgradeUrl,
}: UpgradePromptProps) {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    if (upgradeUrl) {
      window.location.href = upgradeUrl;
    } else {
      navigate(`/upgrade${feature ? `?feature=${feature}` : ''}`);
    }
  };

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-900">
          <Lock className="w-5 h-5" />
          {requiredPlan ? `${requiredPlan} Feature` : 'Upgrade Required'}
        </CardTitle>
        {featureName && (
          <CardDescription className="text-orange-800">
            {featureName}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {featureDescription && (
          <p className="text-sm text-orange-700">
            {featureDescription}
          </p>
        )}
        <Button
          onClick={handleUpgrade}
          className="w-full bg-orange-600 hover:bg-orange-700"
        >
          Upgrade to Unlock
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}
