import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Loader2, FileText } from 'lucide-react';
import { usePDFGeneration } from '@/hooks/usePDFGeneration';
import { campaignApi } from '@/lib/campaign-api';
import { locationApi } from '@/lib/location-api';
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
  const [locationId, setLocationId] = useState<string | null>(null);
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
          console.log('Creating campaign with data:', {
            name: `${campaignData.goal} Campaign - ${new Date().toLocaleDateString()}`,
            description: `${campaignData.headline}`,
            status: 'draft',
          });

          const response = await campaignApi.create({
            name: `${campaignData.goal} Campaign - ${new Date().toLocaleDateString()}`,
            description: `${campaignData.headline}`,
            status: 'draft',
          } as any);

          console.log('Campaign created response:', response);
          console.log('Response type:', typeof response);
          console.log('Response keys:', Object.keys(response || {}));

          // Try multiple possible response structures
          const newCampaignId =
            (response as any)?.campaign?.id ||  // { campaign: { id: ... } }
            (response as any)?.id ||             // { id: ... }
            (response as any)?.data?.id ||       // { data: { id: ... } }
            (response as any)?.campaign_id;      // { campaign_id: ... }

          console.log('Extracted campaignId:', newCampaignId);

          if (newCampaignId) {
            setCampaignId(newCampaignId);
          } else {
            console.error('❌ No campaign ID found in response');
            console.error('Full response structure:', JSON.stringify(response, null, 2));
          }
        } catch (error) {
          console.error('❌ Failed to create campaign:', error);
          console.error('Error details:', error instanceof Error ? error.message : error);
          if (error instanceof Error && 'stack' in error) {
            console.error('Stack trace:', error.stack);
          }
        } finally {
          setIsCreatingCampaign(false);
        }
      }
    };

    createCampaign();
  }, []);

  // Fetch user's locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await locationApi.list();
        console.log('Locations API response:', response);
        console.log('Response type:', typeof response);
        console.log('Response keys:', Object.keys(response || {}));

        // Try multiple possible response structures
        const locations =
          (response as any)?.locations || // { locations: [...] }
          (response as any) || // Direct array
          [];

        console.log('Parsed locations:', locations);
        console.log('Is array?', Array.isArray(locations));

        if (Array.isArray(locations) && locations.length > 0) {
          setLocationId(locations[0].id);
          console.log('✅ Using location:', locations[0]);
        } else if (locations.length > 0) {
          // Might be array-like object
          const firstLocation = locations[0];
          setLocationId(firstLocation.id);
          console.log('✅ Using location (array-like):', firstLocation);
        } else {
          console.error('❌ No locations found for user');
          console.error('Response structure:', JSON.stringify(response, null, 2));
          console.warn('⚠️ Creating default location automatically...');

          // Auto-create a default location
          try {
            const defaultLocation = await locationApi.create({
              name: 'Main Location',
              address: '',
              city: '',
              state: '',
              zip: '',
            });

            console.log('✅ Created default location:', defaultLocation);
            const newLocationId = (defaultLocation as any)?.location?.id || (defaultLocation as any)?.id;

            if (newLocationId) {
              setLocationId(newLocationId);
              console.log('✅ Using newly created location:', newLocationId);
            }
          } catch (createError) {
            console.error('❌ Failed to create default location:', createError);
          }
        }
      } catch (error) {
        console.error('❌ Failed to fetch locations:', error);
        if (error instanceof Error) {
          console.error('Error message:', error.message);
        }
      }
    };

    fetchLocations();
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
            cta: campaignData.cta,
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
  }, [campaignData.layout, campaignData.headline, campaignData.subheadline, campaignData.cta]);

  const handleGenerate = () => {
    if (campaignId && locationId) {
      console.log('Generating PDF for campaign:', campaignId, 'location:', locationId);

      generate({
        campaignId,
        locationId,
        name: campaignData.name,
        layout: (campaignData.layout || 'classic') as 'classic' | 'modern' | 'minimal',
        headline: campaignData.headline,
        subheadline: campaignData.subheadline,
        cta: campaignData.cta,
        branding: tenantBranding,
      });
    } else {
      console.error('❌ Cannot generate PDF:', { campaignId, locationId });
    }
  };

  // Check if we have a completed PDF (asset with file_url populated)
  const hasPDF = assets && assets.length > 0 && assets[0].file_url;

  // Debug logging
  console.log('PDF Preview State:', {
    assetsCount: assets?.length || 0,
    firstAsset: assets?.[0],
    hasPDF,
    isGenerating,
  });

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
            {!campaignId && (
              <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded p-3">
                ⚠️ Creating campaign...
              </p>
            )}
            {!locationId && campaignId && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
                ❌ No business location found. Please contact support or go through onboarding again.
              </p>
            )}
            {!hasPDF ? (
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || isCreatingCampaign || !campaignId || !locationId}
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
                  disabled={!assets[0]?.file_url}
                >
                  <a
                    href={assets[0]?.file_url || '#'}
                    download={`${campaignData.name}.pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      if (!assets[0]?.file_url) {
                        e.preventDefault();
                        console.error('❌ No file URL available for download');
                      }
                    }}
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
