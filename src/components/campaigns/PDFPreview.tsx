import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Loader2, FileText } from 'lucide-react';
import { usePDFGeneration } from '@/hooks/usePDFGeneration';
import { campaignApi } from '@/lib/campaign-api';
import { supabase } from '@/lib/supabase';
import { QRCodeDisplay } from './QRCodeDisplay';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

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
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [loadingPreview, setLoadingPreview] = useState(true);
  const { assets, generate, isGenerating } = usePDFGeneration(campaignId || undefined);

  // Create campaign on mount if not exists
  useEffect(() => {
    const createCampaign = async () => {
      if (!campaignId && !isCreatingCampaign) {
        setIsCreatingCampaign(true);
        try {
          const response = await campaignApi.create({
            name: `${campaignData.goal} Campaign - ${new Date().toLocaleDateString()}`,
            description: `${campaignData.headline}`,
            goal: campaignData.goal,
            status: 'draft',
          } as any);

          console.log('Campaign created:', response);
          setCampaignId((response as any).campaign?.id || (response as any).id);
        } catch (error) {
          console.error('Failed to create campaign:', error);
        } finally {
          setIsCreatingCampaign(false);
        }
      }
    };

    createCampaign();
  }, []);

  // Load preview HTML from backend
  useEffect(() => {
    const loadPreview = async () => {
      setLoadingPreview(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const response = await fetch(`${API_BASE}/api/internal/pdf/preview`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            layout: campaignData.layout,
            headline: campaignData.headline,
            subheadline: campaignData.subheadline,
          }),
        });

        const html = await response.text();
        setPreviewHtml(html);
      } catch (error) {
        console.error('Failed to load preview:', error);
      } finally {
        setLoadingPreview(false);
      }
    };

    loadPreview();
  }, [campaignData.layout, campaignData.headline, campaignData.subheadline]);

  const handleGenerate = () => {
    if (campaignId) {
      generate({
        campaignId,
        name: campaignData.name,
        layout: campaignData.layout,
        headline: campaignData.headline,
        subheadline: campaignData.subheadline,
        cta: campaignData.cta,
        branding: tenantBranding,
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
          <div className="aspect-[8.5/11] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center p-8">
            {loadingPreview ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading preview...</p>
              </div>
            ) : previewHtml ? (
              <div
                style={{
                  width: '595px',
                  height: '770px',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <iframe
                  srcDoc={previewHtml}
                  style={{
                    width: '850px',
                    height: '1100px',
                    transform: 'scale(0.7)',
                    transformOrigin: 'top left',
                    border: 'none',
                  }}
                  sandbox="allow-same-origin"
                  title="Flyer preview"
                />
              </div>
            ) : (
              <div className="text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Preview unavailable</p>
              </div>
            )}
          </div>

          {/* Generate/Download Actions */}
          <div className="space-y-3">
            {!hasPDF ? (
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || isCreatingCampaign || !campaignId}
                className="w-full"
                size="lg"
              >
                {isGenerating || isCreatingCampaign ? (
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
