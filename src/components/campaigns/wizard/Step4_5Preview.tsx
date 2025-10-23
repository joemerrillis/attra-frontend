/**
 * Step 4.5 Preview Component
 *
 * CRITICAL: Full flyer preview before generation
 * - Shows exact preview of flyer with selected background or layout
 * - Edit copy button returns to Step 4
 * - Change background button returns to Step 4 (AI tab)
 * - "Looks Good! Generate Flyer" proceeds to final step
 * - Supports both shared mode and per-location mode
 */

import { useState } from 'react';
import { FlyerPreviewWithBackground } from '../FlyerPreviewWithBackground';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Edit, Image as ImageIcon, CheckCircle } from 'lucide-react';
import { useBackgrounds } from '@/hooks/useBackgrounds';
import { useAuth } from '@/hooks/useAuth';
import type { CampaignCopy, LayoutType, LocationAsset } from '@/types/campaign';

interface Step4_5PreviewProps {
  // Shared mode
  copy?: CampaignCopy;
  layout?: LayoutType;
  backgroundId?: string;

  // Per-location mode
  locationAssets?: LocationAsset[];

  // Actions
  onBack: () => void;
  onEditCopy: () => void;
  onChangeBackground: () => void;
  onApprove: () => void;
}

export function Step4_5Preview({
  copy,
  layout,
  backgroundId,
  locationAssets,
  onBack,
  onEditCopy,
  onChangeBackground,
  onApprove,
}: Step4_5PreviewProps) {
  const { tenant } = useAuth();
  const [activeLocationIndex, setActiveLocationIndex] = useState(0);

  // Determine if we're in per-location mode
  const isPerLocationMode = !!locationAssets && locationAssets.length > 0;

  // Fetch background if backgroundId is provided
  const { backgrounds } = useBackgrounds({
    tenantId: tenant?.id || '',
    enabled: false, // We'll use this just for the type
  });

  // For shared mode, get the selected background
  const selectedBackground = backgroundId
    ? backgrounds.find(b => b.id === backgroundId)
    : undefined;

  // For per-location mode, get the current location's data
  const currentLocation = isPerLocationMode ? locationAssets[activeLocationIndex] : null;
  const currentLocationBackground = currentLocation?.background_id
    ? backgrounds.find(b => b.id === currentLocation.background_id)
    : undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Preview Your Flyer</h2>
          <p className="text-muted-foreground">
            This is exactly how your flyer will look when printed (8.5" × 11")
          </p>
        </div>
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Per-location mode: Location selector */}
      {isPerLocationMode && locationAssets.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview by Location</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {locationAssets.map((asset, index) => (
                <Button
                  key={asset.location_id}
                  variant={activeLocationIndex === index ? 'default' : 'outline'}
                  onClick={() => setActiveLocationIndex(index)}
                  size="sm"
                >
                  Location {index + 1}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shared Mode Preview */}
      {!isPerLocationMode && (
        <FlyerPreviewWithBackground
          background={selectedBackground}
          layout={layout}
          copy={copy || { headline: '', subheadline: '', cta: '' }}
          onEdit={onEditCopy}
          onChangeBackground={onChangeBackground}
          onApprove={onApprove}
        />
      )}

      {/* Per-Location Mode Preview */}
      {isPerLocationMode && currentLocation && (
        <FlyerPreviewWithBackground
          background={currentLocationBackground}
          layout={currentLocation.layout}
          copy={currentLocation.copy}
          locationName={`Location ${activeLocationIndex + 1}`}
          onEdit={onEditCopy}
          onChangeBackground={onChangeBackground}
          onApprove={onApprove}
        />
      )}

      {/* Important Notice */}
      <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <CheckCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold mb-1">Before You Proceed</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Review the headline, subheadline, and call-to-action carefully</li>
                <li>• Ensure text is readable against the background</li>
                <li>• Verify QR code and branding look correct</li>
                <li>• Once generated, you'll be able to download the PDF</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Action Buttons (Mobile-friendly) */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center sticky bottom-4 bg-background p-4 rounded-lg border shadow-lg">
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={onEditCopy} className="flex-1 sm:flex-none">
            <Edit className="w-4 h-4 mr-2" />
            Edit Copy
          </Button>
          <Button variant="outline" onClick={onChangeBackground} className="flex-1 sm:flex-none">
            <ImageIcon className="w-4 h-4 mr-2" />
            Change Background
          </Button>
        </div>

        <Button onClick={onApprove} size="lg" className="w-full sm:w-auto px-8">
          Looks Good! Generate Flyer →
        </Button>
      </div>
    </div>
  );
}
