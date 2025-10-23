/**
 * BackgroundPreviewModal Component
 *
 * CRITICAL: Side-by-side preview of background + flyer with campaign copy
 * Shows users exactly how the background will look with their content before selecting
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Star, Sparkles } from 'lucide-react';
import { FlyerPreviewWithBackground } from './FlyerPreviewWithBackground';
import type { Background } from '@/types/background';
import type { CampaignCopy } from '@/types/campaign';

interface BackgroundPreviewModalProps {
  background: Background | null;
  isOpen: boolean;
  onClose: () => void;
  onSelect: () => void;
  onToggleFavorite: () => void;
  previewCopy?: CampaignCopy; // Show preview with actual campaign copy
}

export function BackgroundPreviewModal({
  background,
  isOpen,
  onClose,
  onSelect,
  onToggleFavorite,
  previewCopy,
}: BackgroundPreviewModalProps) {
  const [showZones, setShowZones] = useState(false);

  if (!background) return null;

  const hasPreviewCopy = previewCopy && previewCopy.headline && previewCopy.subheadline;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Background Preview</DialogTitle>
          <DialogDescription>
            See how your campaign will look with this background
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Full Background Image + Metadata */}
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Background Only</Label>
              <div className="relative rounded-lg overflow-hidden border-2 border-gray-200">
                <img
                  src={background.image_url}
                  alt="Background"
                  className="w-full aspect-[8.5/11] object-cover"
                />

                {/* Safe Zones Overlay */}
                {showZones && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {/* Safe Zones (Green) */}
                    {background.composition_map.safe_zones.map((zone, i) => (
                      <rect
                        key={`safe-${i}`}
                        x={`${(zone.x / 2550) * 100}%`}
                        y={`${(zone.y / 3300) * 100}%`}
                        width={`${(zone.width / 2550) * 100}%`}
                        height={`${(zone.height / 3300) * 100}%`}
                        fill="rgba(0, 255, 0, 0.2)"
                        stroke="green"
                        strokeWidth="2"
                      />
                    ))}

                    {/* Bright Zones (Yellow) */}
                    {background.composition_map.bright_zones.map((zone, i) => (
                      <rect
                        key={`bright-${i}`}
                        x={`${(zone.x / 2550) * 100}%`}
                        y={`${(zone.y / 3300) * 100}%`}
                        width={`${(zone.width / 2550) * 100}%`}
                        height={`${(zone.height / 3300) * 100}%`}
                        fill="rgba(255, 255, 0, 0.15)"
                        stroke="yellow"
                        strokeWidth="1"
                        strokeDasharray="4"
                      />
                    ))}

                    {/* Dark Zones (Blue) */}
                    {background.composition_map.dark_zones.map((zone, i) => (
                      <rect
                        key={`dark-${i}`}
                        x={`${(zone.x / 2550) * 100}%`}
                        y={`${(zone.y / 3300) * 100}%`}
                        width={`${(zone.width / 2550) * 100}%`}
                        height={`${(zone.height / 3300) * 100}%`}
                        fill="rgba(0, 0, 255, 0.15)"
                        stroke="blue"
                        strokeWidth="1"
                        strokeDasharray="4"
                      />
                    ))}
                  </svg>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="space-y-3">
              {/* Style Keywords */}
              {background.style_keywords.length > 0 && (
                <div>
                  <Label>Style</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {background.style_keywords.map((keyword) => (
                      <Badge key={keyword} variant="secondary">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Usage Stats */}
              <div>
                <Label>Usage</Label>
                <p className="text-sm text-muted-foreground">
                  Used {background.times_used} time{background.times_used !== 1 ? 's' : ''}
                  {background.last_used_at && (
                    <> • Last used {new Date(background.last_used_at).toLocaleDateString()}</>
                  )}
                </p>
              </div>

              {/* AI Prompt (Optional) */}
              {background.flux_prompt && (
                <div>
                  <Label>AI Generation Prompt</Label>
                  <p className="text-xs text-muted-foreground font-mono bg-gray-50 p-3 rounded border mt-1 max-h-20 overflow-y-auto">
                    {background.flux_prompt}
                  </p>
                </div>
              )}

              {/* Safe Zones Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowZones(!showZones)}
                className="w-full"
              >
                {showZones ? 'Hide' : 'Show'} Safe Zones
              </Button>
              {showZones && (
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">Green</span> = Safe zones for text •{' '}
                  <span className="text-yellow-600">Yellow</span> = Bright zones •{' '}
                  <span className="text-blue-600">Blue</span> = Dark zones
                </p>
              )}
            </div>
          </div>

          {/* Right: Preview WITH Campaign Copy */}
          <div>
            <Label className="mb-2 block">
              With Your Copy {hasPreviewCopy && <Sparkles className="inline w-4 h-4 ml-1 text-primary" />}
            </Label>

            {hasPreviewCopy ? (
              <div className="rounded-lg overflow-hidden border-2 border-primary">
                <FlyerPreviewWithBackground
                  background={background}
                  copy={previewCopy}
                  compact
                  showSafeZones={showZones}
                />
              </div>
            ) : (
              <div className="w-full aspect-[8.5/11] bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center p-8">
                <div className="text-center space-y-2">
                  <p className="text-muted-foreground">
                    Add campaign copy in Step 4 to see how it looks with this background
                  </p>
                  <p className="text-sm text-muted-foreground">
                    (You can still select this background now)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onToggleFavorite} className="gap-2">
            <Star
              className={`w-4 h-4 ${
                background.is_favorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'
              }`}
            />
            {background.is_favorite ? 'Unfavorite' : 'Favorite'}
          </Button>

          <div className="flex-1" />

          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>

          <Button
            onClick={() => {
              onSelect();
              onClose();
            }}
            className="gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Use This Background
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
