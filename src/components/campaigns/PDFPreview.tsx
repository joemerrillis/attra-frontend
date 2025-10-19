import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Loader2, FileText } from 'lucide-react';
import { usePDFGeneration } from '@/hooks/usePDFGeneration';
import { useCampaign } from '@/hooks/useCampaign';
import { QRCodeDisplay } from './QRCodeDisplay';

interface PDFPreviewProps {
  campaignData: {
    name: string;
    goal: string;
    headline: string;
    subheadline: string;
    cta: string;
    layout: string;
  };
  tenantBranding?: any;
}

export function PDFPreview({ campaignData, tenantBranding }: PDFPreviewProps) {
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const { create, isCreating } = useCampaign();
  const { assets, generate, isGenerating } = usePDFGeneration(campaignId || undefined);

  // Create campaign on mount if not exists
  useEffect(() => {
    if (!campaignId) {
      create(
        {
          name: `${campaignData.goal} Campaign - ${new Date().toLocaleDateString()}`,
          description: `${campaignData.headline}`,
          goal: campaignData.goal,
          status: 'draft',
        },
        {
          onSuccess: (data: any) => {
            setCampaignId(data.id);
          },
        }
      );
    }
  }, []);

  const handleGenerate = () => {
    if (campaignId) {
      generate({
        campaignId,
        layout: campaignData.layout,
      });
    }
  };

  const hasPDF = assets && assets.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">
          <span className="text-gray-400">&gt;●</span> Generate Your Flyer
        </h2>
        <p className="text-muted-foreground">
          Create your print-ready PDF with embedded QR code
        </p>
      </div>

      {/* Preview Card */}
      <Card>
        <CardHeader>
          <CardTitle>Flyer Preview</CardTitle>
          <CardDescription>
            Your branded flyer will include a QR code that tracks scans
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Visual Preview */}
          <div className="aspect-[8.5/11] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-8 text-center">
            {tenantBranding?.logo_url && (
              <img
                src={tenantBranding.logo_url}
                alt="Logo"
                className="h-16 mb-6"
              />
            )}
            <h3 className="text-2xl font-bold mb-3">{campaignData.headline}</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              {campaignData.subheadline}
            </p>
            <div className="bg-white p-4 rounded shadow-sm mb-4">
              <div className="w-32 h-32 bg-black" />
              <p className="text-xs text-muted-foreground mt-2">QR Code</p>
            </div>
            {campaignData.cta && (
              <p className="text-lg font-semibold text-primary">
                {campaignData.cta}
              </p>
            )}
          </div>

          {/* Generate/Download Actions */}
          <div className="space-y-3">
            {!hasPDF ? (
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || isCreating || !campaignId}
                className="w-full"
                size="lg"
              >
                {isGenerating || isCreating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5 mr-2" />
                    Generate Flyer PDF
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  className="w-full"
                  size="lg"
                >
                  <a
                    href={assets[0].file_url}
                    download={`${campaignData.name}.pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Download PDF
                  </a>
                </Button>

                <Button
                  variant="outline"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full"
                >
                  Regenerate PDF
                </Button>
              </>
            )}
          </div>

          {/* QR Code Info */}
          {hasPDF && campaignId && (
            <QRCodeDisplay campaignId={campaignId} />
          )}
        </CardContent>
      </Card>

      {/* Success Message */}
      {hasPDF && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <p className="text-green-800 font-medium">
              ✓ Your flyer is ready! Download and print to start capturing real-world interest.
            </p>
            <p className="text-green-700 text-sm mt-2">
              The embedded QR code will track every scan and help you measure your campaign's impact.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
