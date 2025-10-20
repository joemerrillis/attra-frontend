import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { BrandedHeader } from '@/components/scan/BrandedHeader';
import { ContactCaptureForm } from '@/components/scan/ContactCaptureForm';
import { PrivacyNotice } from '@/components/scan/PrivacyNotice';
import { ScanSuccessModal } from '@/components/scan/ScanSuccessModal';
import { useQRLinkData } from '@/hooks/useQRLinkData';
import { useScanTracking } from '@/hooks/useScanTracking';
import { useContactCapture } from '@/hooks/useContactCapture';

export default function ScanLanding() {
  const { id: qrId } = useParams<{ id: string }>();

  // Fetch QR link data
  const { data: qrData, isLoading, error: qrError } = useQRLinkData(qrId!);

  // Track scan event (runs once on mount)
  useScanTracking(qrId!);

  // Contact capture
  const { capture, isCapturing, isSuccess, error: captureError } = useContactCapture();

  // Handle form submission
  const handleSubmit = (data: { name: string; email: string }) => {
    if (!qrData) return;

    capture({
      name: data.name,
      email: data.email,
      qr_link_id: qrId!,
      campaign_id: (qrData as any).campaign_id,
    });
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Error State - Invalid QR Code
  if (qrError || !qrData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2 text-gray-900">
              QR Code Not Found
            </h1>
            <p className="text-gray-600 mb-4">
              This QR code is invalid or has been deactivated.
            </p>
            <p className="text-sm text-gray-500">
              Please check the code and try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Extract data
  const tenant = (qrData as any).tenant || {};
  const campaign = (qrData as any).campaign || {};
  const redirectUrl = (qrData as any).redirect_url || (qrData as any).base_url;

  // Success State - Show redirect countdown
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <ScanSuccessModal
            redirectUrl={redirectUrl}
            tenantName={tenant.name}
            delay={3}
          />
        </div>
      </div>
    );
  }

  // Main Capture Form State
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="shadow-xl">
          <CardContent className="pt-8 pb-8">
            {/* Branded Header with ●> symbol */}
            <BrandedHeader
              tenantName={tenant.name}
              tenantLogo={tenant.branding?.logo_url}
              campaignHeadline={campaign.headline}
              campaignSubheadline={campaign.subheadline}
            />

            {/* Contact Capture Form */}
            <div className="space-y-6">
              <ContactCaptureForm
                onSubmit={handleSubmit}
                isSubmitting={isCapturing}
                error={captureError}
                ctaText={campaign.cta || 'Continue'}
              />

              {/* Privacy Notice */}
              <PrivacyNotice />
            </div>
          </CardContent>
        </Card>

        {/* Powered by Attra */}
        <p className="text-center text-xs text-gray-500 mt-4">
          Powered by{' '}
          <span className="font-semibold text-gray-700">●>attra>●</span>
        </p>
      </div>
    </div>
  );
}
