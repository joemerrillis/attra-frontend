import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScanSuccessModalProps {
  redirectUrl: string;
  tenantName: string;
  delay?: number; // seconds before auto-redirect
}

export function ScanSuccessModal({
  redirectUrl,
  tenantName,
  delay = 3,
}: ScanSuccessModalProps) {
  const [countdown, setCountdown] = useState(delay);

  useEffect(() => {
    if (countdown <= 0) {
      window.location.href = redirectUrl;
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, redirectUrl]);

  const handleManualRedirect = () => {
    window.location.href = redirectUrl;
  };

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-800">
          <CheckCircle2 className="w-6 h-6" />
          Thank you!
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-green-700">
          We've saved your information. {tenantName} will be in touch soon!
        </p>

        <div className="flex items-center justify-between">
          <p className="text-sm text-green-600">
            Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRedirect}
            className="border-green-600 text-green-700 hover:bg-green-100"
          >
            Continue Now
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
