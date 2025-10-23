/**
 * FlyerPreviewWithBackground Component
 *
 * CRITICAL: Shows accurate preview of flyer before generation
 * - Used in Step 4.5 (full preview)
 * - Used in BackgroundPreviewModal (with campaign copy)
 * - Supports both AI backgrounds and classic templates
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2, Edit, Image as ImageIcon } from 'lucide-react';
import type { Background } from '@/types/background';
import type { CampaignCopy, LayoutType } from '@/types/campaign';
import {
  getHeadlineStyle,
  getQRZoneStyle,
  getLayoutStyles,
  generatePlaceholderQR,
  wrapText,
} from '@/lib/preview-utils';

interface FlyerPreviewWithBackgroundProps {
  // Background source (mutually exclusive with layout)
  background?: Background;
  layout?: LayoutType;

  // Content
  copy: CampaignCopy;
  qrCodeUrl?: string;
  locationName?: string;

  // Display options
  compact?: boolean; // Smaller version for modal
  showSafeZones?: boolean; // Debug mode
  className?: string;

  // Actions
  onEdit?: () => void;
  onChangeBackground?: () => void;
  onApprove?: () => void;
}

type ZoomLevel = 'fit' | 100 | 150 | 200;

export function FlyerPreviewWithBackground({
  background,
  layout,
  copy,
  qrCodeUrl,
  locationName,
  compact = false,
  showSafeZones = false,
  className = '',
  onEdit,
  onChangeBackground,
  onApprove,
}: FlyerPreviewWithBackgroundProps) {
  const [zoom, setZoom] = useState<ZoomLevel>('fit');
  const [showZones, setShowZones] = useState(showSafeZones);

  const headlineStyle = background
    ? getHeadlineStyle(background.composition_map)
    : {
        position: 'absolute' as const,
        top: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '80%',
        textAlign: 'center' as const,
        color: '#FFFFFF',
        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
      };

  const qrZoneStyle = background
    ? getQRZoneStyle(background.composition_map)
    : {
        position: 'absolute' as const,
        bottom: '10%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '70%',
        textAlign: 'center' as const,
        color: '#FFFFFF',
        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
      };

  const layoutStyles = layout ? getLayoutStyles(layout) : {};

  // Wrap headline if too long
  const headlineLines = wrapText(copy.headline || 'Your Headline Here', 30);

  const containerClassName = compact
    ? 'w-full max-w-sm'
    : 'w-full max-w-4xl mx-auto';

  return (
    <div className={`flex flex-col space-y-4 ${containerClassName} ${className}`}>
      {/* Header with Controls */}
      {!compact && (
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              Preview{locationName ? `: ${locationName}` : ''}
            </h3>
            <p className="text-sm text-muted-foreground">
              This is how your flyer will look when printed (8.5" × 11")
            </p>
          </div>

          {/* Zoom Controls */}
          <div className="flex gap-2">
            <Button
              variant={zoom === 'fit' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setZoom('fit')}
            >
              <Maximize2 className="w-4 h-4 mr-1" />
              Fit
            </Button>
            <Button
              variant={zoom === 100 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setZoom(100)}
            >
              100%
            </Button>
            <Button
              variant={zoom === 150 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setZoom(150)}
            >
              150%
            </Button>
            <Button
              variant={zoom === 200 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setZoom(200)}
            >
              <ZoomIn className="w-4 h-4 mr-1" />
              200%
            </Button>
          </div>
        </div>
      )}

      {/* Preview Container */}
      <div
        className="border-2 border-gray-300 rounded-lg overflow-auto bg-gray-50 shadow-xl"
        style={{
          maxHeight: compact ? '500px' : '70vh',
        }}
      >
        <div
          className="relative bg-white mx-auto"
          style={{
            width: zoom === 'fit' ? '100%' : '850px',
            aspectRatio: '8.5 / 11',
            transform: zoom === 200 ? 'scale(2)' : zoom === 150 ? 'scale(1.5)' : 'scale(1)',
            transformOrigin: 'top center',
          }}
        >
          {/* Background Layer */}
          {background && (
            <img
              src={background.image_url}
              alt="Background"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {/* Classic Template Background */}
          {layout && !background && (
            <div
              className="absolute inset-0"
              style={layoutStyles}
            />
          )}

          {/* Content Overlay */}
          <div className="absolute inset-0 flex flex-col justify-between p-8">
            {/* Headline Zone */}
            <div style={headlineStyle}>
              <div className="space-y-2">
                {headlineLines.map((line, i) => (
                  <h1
                    key={i}
                    className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"
                    style={{ color: headlineStyle.color }}
                  >
                    {line}
                  </h1>
                ))}
                {copy.subheadline && (
                  <p
                    className="text-xl md:text-2xl mt-4"
                    style={{ color: headlineStyle.color }}
                  >
                    {copy.subheadline}
                  </p>
                )}
              </div>
            </div>

            {/* QR Code + CTA Zone */}
            <div style={qrZoneStyle}>
              <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                {/* QR Code with White Backing */}
                <div className="bg-white p-4 rounded-lg shadow-2xl">
                  <img
                    src={qrCodeUrl || generatePlaceholderQR()}
                    alt="QR Code"
                    className="w-32 h-32 md:w-40 md:h-40"
                  />
                </div>

                {/* CTA Text */}
                {copy.cta && (
                  <div className="text-center md:text-left">
                    <p
                      className="text-2xl md:text-3xl font-semibold"
                      style={{ color: qrZoneStyle.color }}
                    >
                      {copy.cta}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Safe Zones Overlay (Debug Mode) */}
          {showZones && background?.composition_map && (
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

          {/* Zone Toggle (Bottom-right corner) */}
          {background && !compact && (
            <Button
              variant="secondary"
              size="sm"
              className="absolute bottom-2 right-2 opacity-75 hover:opacity-100"
              onClick={() => setShowZones(!showZones)}
            >
              {showZones ? 'Hide Zones' : 'Show Zones'}
            </Button>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {!compact && (onEdit || onChangeBackground || onApprove) && (
        <div className="flex flex-wrap gap-4 justify-between">
          <div className="flex gap-2">
            {onEdit && (
              <Button variant="outline" onClick={onEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Copy
              </Button>
            )}
            {onChangeBackground && (
              <Button variant="outline" onClick={onChangeBackground}>
                <ImageIcon className="w-4 h-4 mr-2" />
                Change Background
              </Button>
            )}
          </div>

          {onApprove && (
            <Button onClick={onApprove} size="lg" className="px-8">
              Looks Good! Generate Flyer →
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
