import { useState, useEffect, useRef } from 'react';
import Moveable from 'react-moveable';
import { flushSync } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import type { TextPositions } from '@/types/asset';
import { useToast } from '@/hooks/use-toast';

interface InteractiveEditorProps {
  backgroundUrl: string;
  compositionMap: any | null;
  onBack: () => void;
  onGenerate: (data: {
    headline: string;
    subheadline: string;
    cta: string;
    textPositions: TextPositions;
  }) => void;
  isGenerating?: boolean;
}

// Asset dimensions match actual output size (8.5"x11" at 300 DPI)
const ASSET_DIMENSIONS = { width: 2550, height: 3300 };
const DISPLAY_SCALE = 600 / 2550; // Scale down to ~600px for UI display

// Default positions in asset coordinates (2550x3300)
const defaultTextPositions: TextPositions = {
  headline: {
    x: 170,      // 40 * 4.25
    y: 726,      // 198 * 3.667
    width: 2210, // 520 * 4.25
    height: 'auto',
    fontSize: 153, // 36 * 4.25
    fontWeight: 'bold',
  },
  subheadline: {
    x: 170,      // 40 * 4.25
    y: 1188,     // 324 * 3.667
    width: 2210, // 520 * 4.25
    height: 'auto',
    fontSize: 93, // 22 * 4.25 (rounded)
    fontWeight: 'normal',
  },
  cta: {
    x: 170,      // 40 * 4.25
    y: 2383,     // 650 * 3.667
    width: 2210, // 520 * 4.25
    height: 'auto',
    fontSize: 93, // 22 * 4.25 (rounded)
    fontWeight: 'bold',
  },
  qrCode: {
    x: 850,   // 200 * 4.25
    y: 1283,  // 350 * 3.667
    size: 850, // 200 * 4.25
  },
};

export function InteractiveEditor({
  backgroundUrl,
  compositionMap,
  onBack,
  onGenerate,
  isGenerating = false,
}: InteractiveEditorProps) {
  const [headline, setHeadline] = useState('Your Headline Here');
  const [subheadline, setSubheadline] = useState('');
  const [cta, setCta] = useState('Scan to Learn More');
  const [textPositions, setTextPositions] = useState<TextPositions>(defaultTextPositions);
  const [draggingElement, setDraggingElement] = useState<string | null>(null);
  const [resizingElement, setResizingElement] = useState<string | null>(null);
  const [textColors, setTextColors] = useState({
    headline: '#000000',
    subheadline: '#000000',
    cta: '#000000',
  });
  const [autoTextColor, setAutoTextColor] = useState(true);
  const [transformedZones, setTransformedZones] = useState<{
    bright_zones: any[];
    dark_zones: any[];
  } | null>(null);
  const { toast } = useToast();

  // Refs for Moveable components
  const headlineRef = useRef<HTMLDivElement>(null);
  const subheadlineRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const qrCodeRef = useRef<HTMLDivElement>(null);

  const headlineMoveableRef = useRef<Moveable>(null);
  const subheadlineMoveableRef = useRef<Moveable>(null);
  const ctaMoveableRef = useRef<Moveable>(null);
  const qrCodeMoveableRef = useRef<Moveable>(null);

  // Guideline positions in asset coordinates (2550x3300) at 1/4, 1/3, 1/2, 2/3, 3/4
  const VERTICAL_GUIDELINES = [638, 850, 1275, 1700, 1913];      // For 2550px width
  const HORIZONTAL_GUIDELINES = [825, 1100, 1650, 2200, 2475];   // For 3300px height

  /**
   * Clamp position to valid canvas bounds and round to integers
   * Ensures Cloudinary receives valid transformation parameters
   */
  const clampPosition = (
    x: number,
    y: number,
    width: number,
    height: number | 'auto'
  ): { x: number; y: number } => {
    // Round to integers (Cloudinary may reject decimals)
    let clampedX = Math.round(x);
    let clampedY = Math.round(y);
    const roundedWidth = Math.round(width);

    // Clamp to canvas bounds
    clampedX = Math.max(0, Math.min(clampedX, ASSET_DIMENSIONS.width - roundedWidth));
    clampedY = Math.max(0, Math.min(clampedY, ASSET_DIMENSIONS.height - (height === 'auto' ? 100 : Math.round(height))));

    return { x: clampedX, y: clampedY };
  };

  /**
   * Check if two zones overlap
   */
  const zonesOverlap = (zone1: any, zone2: any): boolean => {
    return !(
      zone1.x + zone1.width < zone2.x ||
      zone2.x + zone2.width < zone1.x ||
      zone1.y + zone1.height < zone2.y ||
      zone2.y + zone2.height < zone1.y
    );
  };

  /**
   * Calculate total overlap area between text box and zones
   */
  const calculateOverlapArea = (textBox: any, zones: any[]): number => {
    return zones.reduce((total, zone) => {
      if (!zonesOverlap(textBox, zone)) return total;

      const overlapX = Math.max(0, Math.min(textBox.x + textBox.width, zone.x + zone.width) - Math.max(textBox.x, zone.x));
      const overlapY = Math.max(0, Math.min(textBox.y + textBox.height, zone.y + zone.height) - Math.max(textBox.y, zone.y));

      return total + (overlapX * overlapY);
    }, 0);
  };

  /**
   * Transform composition_map zones from image coordinates to preview coordinates
   * @param zones Array of zones with x, y, width, height in image space
   * @param imageWidth Native image width (e.g., 1024)
   * @param imageHeight Native image height (e.g., 1024)
   * @param previewWidth Preview container width (600)
   * @param previewHeight Preview container height (900)
   * @returns Array of zones in preview coordinate space
   */
  const transformZonesToPreview = (
    zones: any[],
    imageWidth: number,
    imageHeight: number,
    previewWidth: number,
    previewHeight: number
  ): any[] => {
    if (!zones || zones.length === 0) return [];

    const scaleX = previewWidth / imageWidth;
    const scaleY = previewHeight / imageHeight;

    return zones.map(zone => ({
      x: zone.x * scaleX,
      y: zone.y * scaleY,
      width: zone.width * scaleX,
      height: zone.height * scaleY,
    }));
  };

  /**
   * Calculate optimal text color from pre-transformed zones
   */
  const getOptimalTextColorFromZones = (
    x: number,
    y: number,
    width: number,
    height: number,
    brightZones: any[],
    darkZones: any[]
  ): string => {
    const textBox = { x, y, width, height };

    // Calculate overlap with dark and bright zones (already in preview coordinates)
    const darkOverlapArea = calculateOverlapArea(textBox, darkZones);
    const brightOverlapArea = calculateOverlapArea(textBox, brightZones);

    // If text overlaps more with dark zones, use white text
    // If text overlaps more with bright zones, use black text
    return darkOverlapArea > brightOverlapArea ? '#FFFFFF' : '#000000';
  };

  /**
   * Calculate optimal text color based on background brightness at position
   * Uses transformed composition_map zones in preview coordinate space
   */
  const getOptimalTextColor = (
    x: number,
    y: number,
    width: number,
    height: number
  ): string => {
    if (!transformedZones || !autoTextColor) {
      return '#000000'; // Default to black if no analysis or manual mode
    }

    return getOptimalTextColorFromZones(
      x,
      y,
      width,
      height,
      transformedZones.bright_zones,
      transformedZones.dark_zones
    );
  };

  const updateTextPosition = (
    field: 'headline' | 'subheadline' | 'cta',
    updates: Partial<TextPositions[typeof field]>
  ) => {
    setTextPositions((prev) => {
      const newPosition = { ...prev[field], ...updates };

      // Update text color based on new position (if auto mode and zones available)
      if (autoTextColor && transformedZones) {
        const optimalColor = getOptimalTextColor(
          newPosition.x,
          newPosition.y,
          newPosition.width,
          80  // Approximate height for color calculation
        );

        setTextColors(colors => ({
          ...colors,
          [field]: optimalColor,
        }));
      }

      return {
        ...prev,
        [field]: newPosition,
      };
    });
  };

  const resetToDefaults = () => {
    setTextPositions(defaultTextPositions);
    toast({
      title: 'Positions Reset',
      description: 'Text positions restored to defaults',
    });
  };

  const handleGenerate = () => {
    onGenerate({ headline, subheadline, cta, textPositions });
  };

  // Transform composition map zones and initialize text colors
  useEffect(() => {
    if (compositionMap) {
      // Get image dimensions from composition_map metadata
      // Backend Sharp analysis uses the native image dimensions
      const imageWidth = compositionMap.metadata?.width || 1024;
      const imageHeight = compositionMap.metadata?.height || 1024;
      const previewWidth = 600;
      const previewHeight = 900;

      // Transform zones to preview coordinates
      const transformedBrightZones = transformZonesToPreview(
        compositionMap.bright_zones || [],
        imageWidth,
        imageHeight,
        previewWidth,
        previewHeight
      );

      const transformedDarkZones = transformZonesToPreview(
        compositionMap.dark_zones || [],
        imageWidth,
        imageHeight,
        previewWidth,
        previewHeight
      );

      setTransformedZones({
        bright_zones: transformedBrightZones,
        dark_zones: transformedDarkZones,
      });

      // Initialize text colors with transformed zones
      if (autoTextColor) {
        setTextColors({
          headline: getOptimalTextColorFromZones(
            defaultTextPositions.headline.x,
            defaultTextPositions.headline.y,
            defaultTextPositions.headline.width,
            80,
            transformedBrightZones,
            transformedDarkZones
          ),
          subheadline: getOptimalTextColorFromZones(
            defaultTextPositions.subheadline.x,
            defaultTextPositions.subheadline.y,
            defaultTextPositions.subheadline.width,
            60,
            transformedBrightZones,
            transformedDarkZones
          ),
          cta: getOptimalTextColorFromZones(
            defaultTextPositions.cta.x,
            defaultTextPositions.cta.y,
            defaultTextPositions.cta.width,
            60,
            transformedBrightZones,
            transformedDarkZones
          ),
        });
      }
    }
  }, [compositionMap]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Preview Panel */}
        <div className="flex-1 lg:w-[60%]">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Preview</h3>
              <Button
                onClick={resetToDefaults}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>
            </div>
            {/* Outer container constrains layout space */}
            <div
              className="mx-auto"
              style={{
                width: '600px',
                height: `${ASSET_DIMENSIONS.height * DISPLAY_SCALE}px`, // 3300 * 0.235 = 776px
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {/* Inner container is actual asset size, scaled down */}
              <div
                className="relative bg-muted"
                style={{
                  width: `${ASSET_DIMENSIONS.width}px`,
                  height: `${ASSET_DIMENSIONS.height}px`,
                  transform: `scale(${DISPLAY_SCALE})`,
                  transformOrigin: 'top left',
                  overflow: 'hidden',
                }}
              >
              {/* Background Image */}
              <img
                src={backgroundUrl}
                alt="Background"
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Draggable Headline */}
              {headline && (
                <>
                  <div
                    ref={headlineRef}
                    className={`draggable-text ${draggingElement === 'headline' ? 'dragging' : ''} ${resizingElement === 'headline' ? 'resizing' : ''}`}
                    style={{
                      position: 'absolute',
                      left: `${textPositions.headline.x}px`,
                      top: `${textPositions.headline.y}px`,
                      width: `${textPositions.headline.width}px`,
                      height: textPositions.headline.height === 'auto' ? 'auto' : `${textPositions.headline.height}px`,
                      fontSize: `${textPositions.headline.fontSize}px`,
                      fontWeight: textPositions.headline.fontWeight,
                      color: textColors.headline,
                      fontFamily: 'Arial, sans-serif',
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: draggingElement === 'headline' ? 'grabbing' : 'grab',
                      userSelect: 'none',
                      padding: '8px',
                      wordWrap: 'break-word',
                      whiteSpace: 'pre-line',
                      overflow: 'hidden',
                      textShadow: textColors.headline === '#FFFFFF'
                        ? '2px 2px 4px rgba(0,0,0,0.8)'
                        : 'none',
                    }}
                  >
                    {headline}
                  </div>
                  <Moveable
                    ref={headlineMoveableRef}
                    target={headlineRef}
                    draggable={true}
                    resizable={true}
                    snappable={true}
                    snapThreshold={21}
                    verticalGuidelines={VERTICAL_GUIDELINES}
                    horizontalGuidelines={HORIZONTAL_GUIDELINES}
                    isDisplaySnapDigit={true}
                    bounds={{ left: 0, top: 0, right: ASSET_DIMENSIONS.width, bottom: ASSET_DIMENSIONS.height }}
                    renderDirections={['w', 'e', 'n', 's']}
                    flushSync={flushSync}
                    onDragStart={() => setDraggingElement('headline')}
                    onDrag={(e) => {
                      if (e.target instanceof HTMLElement) {
                        e.target.style.left = `${e.left}px`;
                        e.target.style.top = `${e.top}px`;
                      }
                    }}
                    onDragEnd={(e) => {
                      setDraggingElement(null);
                      const clamped = clampPosition(
                        e.lastEvent!.left,
                        e.lastEvent!.top,
                        textPositions.headline.width,
                        textPositions.headline.height ?? 'auto'
                      );
                      updateTextPosition('headline', { x: clamped.x, y: clamped.y });
                    }}
                    onResizeStart={() => setResizingElement('headline')}
                    onResize={(e) => {
                      if (e.target instanceof HTMLElement) {
                        e.target.style.width = `${e.width}px`;
                        e.target.style.height = `${e.height}px`;
                        e.target.style.left = `${e.drag.left}px`;
                        e.target.style.top = `${e.drag.top}px`;
                      }
                    }}
                    onResizeEnd={(e) => {
                      setResizingElement(null);
                      const clamped = clampPosition(
                        e.lastEvent!.drag.left,
                        e.lastEvent!.drag.top,
                        e.lastEvent!.width,
                        e.lastEvent!.height
                      );
                      updateTextPosition('headline', {
                        x: clamped.x,
                        y: clamped.y,
                        width: Math.round(e.lastEvent!.width),
                        height: Math.round(e.lastEvent!.height),
                      });
                    }}
                  />
                </>
              )}

              {/* Draggable Subheadline */}
              {subheadline && (
                <>
                  <div
                    ref={subheadlineRef}
                    className={`draggable-text ${draggingElement === 'subheadline' ? 'dragging' : ''} ${resizingElement === 'subheadline' ? 'resizing' : ''}`}
                    style={{
                      position: 'absolute',
                      left: `${textPositions.subheadline.x}px`,
                      top: `${textPositions.subheadline.y}px`,
                      width: `${textPositions.subheadline.width}px`,
                      height: textPositions.subheadline.height === 'auto' ? 'auto' : `${textPositions.subheadline.height}px`,
                      fontSize: `${textPositions.subheadline.fontSize}px`,
                      fontWeight: textPositions.subheadline.fontWeight,
                      color: textColors.subheadline,
                      fontFamily: 'Arial, sans-serif',
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: draggingElement === 'subheadline' ? 'grabbing' : 'grab',
                      userSelect: 'none',
                      padding: '8px',
                      wordWrap: 'break-word',
                      whiteSpace: 'pre-line',
                      overflow: 'hidden',
                      textShadow: textColors.subheadline === '#FFFFFF'
                        ? '2px 2px 4px rgba(0,0,0,0.8)'
                        : 'none',
                    }}
                  >
                    {subheadline}
                  </div>
                  <Moveable
                    ref={subheadlineMoveableRef}
                    target={subheadlineRef}
                    draggable={true}
                    resizable={true}
                    snappable={true}
                    snapThreshold={21}
                    verticalGuidelines={VERTICAL_GUIDELINES}
                    horizontalGuidelines={HORIZONTAL_GUIDELINES}
                    isDisplaySnapDigit={true}
                    bounds={{ left: 0, top: 0, right: ASSET_DIMENSIONS.width, bottom: ASSET_DIMENSIONS.height }}
                    renderDirections={['w', 'e', 'n', 's']}
                    flushSync={flushSync}
                    onDragStart={() => setDraggingElement('subheadline')}
                    onDrag={(e) => {
                      if (e.target instanceof HTMLElement) {
                        e.target.style.left = `${e.left}px`;
                        e.target.style.top = `${e.top}px`;
                      }
                    }}
                    onDragEnd={(e) => {
                      setDraggingElement(null);
                      const clamped = clampPosition(
                        e.lastEvent!.left,
                        e.lastEvent!.top,
                        textPositions.subheadline.width,
                        textPositions.subheadline.height ?? 'auto'
                      );
                      updateTextPosition('subheadline', { x: clamped.x, y: clamped.y });
                    }}
                    onResizeStart={() => setResizingElement('subheadline')}
                    onResize={(e) => {
                      if (e.target instanceof HTMLElement) {
                        e.target.style.width = `${e.width}px`;
                        e.target.style.height = `${e.height}px`;
                        e.target.style.left = `${e.drag.left}px`;
                        e.target.style.top = `${e.drag.top}px`;
                      }
                    }}
                    onResizeEnd={(e) => {
                      setResizingElement(null);
                      const clamped = clampPosition(
                        e.lastEvent!.drag.left,
                        e.lastEvent!.drag.top,
                        e.lastEvent!.width,
                        e.lastEvent!.height
                      );
                      updateTextPosition('subheadline', {
                        x: clamped.x,
                        y: clamped.y,
                        width: Math.round(e.lastEvent!.width),
                        height: Math.round(e.lastEvent!.height),
                      });
                    }}
                  />
                </>
              )}

              {/* Draggable QR Code - Migrated to react-moveable for POC */}
              <>
                <div
                  ref={qrCodeRef}
                  className={`draggable-qr ${draggingElement === 'qrCode' ? 'dragging' : ''} ${resizingElement === 'qrCode' ? 'resizing' : ''}`}
                  style={{
                    position: 'absolute',
                    left: `${textPositions.qrCode.x}px`,
                    top: `${textPositions.qrCode.y}px`,
                    width: `${textPositions.qrCode.size}px`,
                    height: `${textPositions.qrCode.size}px`,
                  }}
                >
                  <div className="w-full h-full bg-white rounded-lg shadow-lg flex items-center justify-center border-4 border-gray-200">
                    <div className="w-[85%] h-[85%] bg-gradient-to-br from-gray-100 to-gray-200 rounded flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <div className="text-2xl mb-2">QR</div>
                        <div className="text-xs">Generated<br />in final asset</div>
                      </div>
                    </div>
                  </div>
                </div>
                <Moveable
                  ref={qrCodeMoveableRef}
                  target={qrCodeRef}
                  draggable={true}
                  resizable={true}
                  keepRatio={true}
                  snappable={true}
                  snapThreshold={21}
                  verticalGuidelines={VERTICAL_GUIDELINES}
                  horizontalGuidelines={HORIZONTAL_GUIDELINES}
                  isDisplaySnapDigit={true}
                  bounds={{ left: 0, top: 0, right: ASSET_DIMENSIONS.width, bottom: ASSET_DIMENSIONS.height }}
                  renderDirections={['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w']}
                  flushSync={flushSync}
                  onDragStart={() => setDraggingElement('qrCode')}
                  onDrag={(e) => {
                    if (e.target instanceof HTMLElement) {
                      e.target.style.left = `${e.left}px`;
                      e.target.style.top = `${e.top}px`;
                    }
                  }}
                  onDragEnd={(e) => {
                    setDraggingElement(null);
                    const clamped = clampPosition(
                      e.lastEvent!.left,
                      e.lastEvent!.top,
                      textPositions.qrCode.size,
                      textPositions.qrCode.size
                    );
                    setTextPositions((prev) => ({
                      ...prev,
                      qrCode: { ...prev.qrCode, x: clamped.x, y: clamped.y },
                    }));
                  }}
                  onResizeStart={() => setResizingElement('qrCode')}
                  onResize={(e) => {
                    if (e.target instanceof HTMLElement) {
                      e.target.style.width = `${e.width}px`;
                      e.target.style.height = `${e.height}px`;
                      e.target.style.left = `${e.drag.left}px`;
                      e.target.style.top = `${e.drag.top}px`;
                    }
                  }}
                  onResizeEnd={(e) => {
                    setResizingElement(null);
                    const newSize = Math.round(e.lastEvent!.width);
                    const clamped = clampPosition(
                      e.lastEvent!.drag.left,
                      e.lastEvent!.drag.top,
                      newSize,
                      newSize
                    );
                    setTextPositions((prev) => ({
                      ...prev,
                      qrCode: {
                        x: clamped.x,
                        y: clamped.y,
                        size: newSize
                      },
                    }));
                  }}
                />
              </>

              {/* Draggable CTA */}
              {cta && (
                <>
                  <div
                    ref={ctaRef}
                    className={`draggable-text ${draggingElement === 'cta' ? 'dragging' : ''} ${resizingElement === 'cta' ? 'resizing' : ''}`}
                    style={{
                      position: 'absolute',
                      left: `${textPositions.cta.x}px`,
                      top: `${textPositions.cta.y}px`,
                      width: `${textPositions.cta.width}px`,
                      height: textPositions.cta.height === 'auto' ? 'auto' : `${textPositions.cta.height}px`,
                      fontSize: `${textPositions.cta.fontSize}px`,
                      fontWeight: textPositions.cta.fontWeight,
                      color: textColors.cta,
                      fontFamily: 'Arial, sans-serif',
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: draggingElement === 'cta' ? 'grabbing' : 'grab',
                      userSelect: 'none',
                      padding: '8px',
                      wordWrap: 'break-word',
                      whiteSpace: 'pre-line',
                      overflow: 'hidden',
                      textShadow: textColors.cta === '#FFFFFF'
                        ? '2px 2px 4px rgba(0,0,0,0.8)'
                        : 'none',
                    }}
                  >
                    {cta}
                  </div>
                  <Moveable
                    ref={ctaMoveableRef}
                    target={ctaRef}
                    draggable={true}
                    resizable={true}
                    snappable={true}
                    snapThreshold={21}
                    verticalGuidelines={VERTICAL_GUIDELINES}
                    horizontalGuidelines={HORIZONTAL_GUIDELINES}
                    isDisplaySnapDigit={true}
                    bounds={{ left: 0, top: 0, right: ASSET_DIMENSIONS.width, bottom: ASSET_DIMENSIONS.height }}
                    renderDirections={['w', 'e', 'n', 's']}
                    flushSync={flushSync}
                    onDragStart={() => setDraggingElement('cta')}
                    onDrag={(e) => {
                      if (e.target instanceof HTMLElement) {
                        e.target.style.left = `${e.left}px`;
                        e.target.style.top = `${e.top}px`;
                      }
                    }}
                    onDragEnd={(e) => {
                      setDraggingElement(null);
                      const clamped = clampPosition(
                        e.lastEvent!.left,
                        e.lastEvent!.top,
                        textPositions.cta.width,
                        textPositions.cta.height ?? 'auto'
                      );
                      updateTextPosition('cta', { x: clamped.x, y: clamped.y });
                    }}
                    onResizeStart={() => setResizingElement('cta')}
                    onResize={(e) => {
                      if (e.target instanceof HTMLElement) {
                        e.target.style.width = `${e.width}px`;
                        e.target.style.height = `${e.height}px`;
                        e.target.style.left = `${e.drag.left}px`;
                        e.target.style.top = `${e.drag.top}px`;
                      }
                    }}
                    onResizeEnd={(e) => {
                      setResizingElement(null);
                      const clamped = clampPosition(
                        e.lastEvent!.drag.left,
                        e.lastEvent!.drag.top,
                        e.lastEvent!.width,
                        e.lastEvent!.height
                      );
                      updateTextPosition('cta', {
                        x: clamped.x,
                        y: clamped.y,
                        width: Math.round(e.lastEvent!.width),
                        height: Math.round(e.lastEvent!.height),
                      });
                    }}
                  />
                </>
              )}
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Controls Panel */}
        <div className="flex-1 lg:w-[40%]">
          <Card className="p-4 md:p-6">
            <h3 className="text-lg font-semibold mb-4">Edit Your Text</h3>

            <div className="space-y-4">
              {/* Headline */}
              <div className="space-y-2">
                <Label htmlFor="headline" className="text-sm font-medium">
                  Headline *
                </Label>
                <Textarea
                  id="headline"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Your Headline Here"
                  className="text-lg min-h-[3rem] resize-none"
                  maxLength={100}
                  rows={2}
                />
                <div className="text-xs text-muted-foreground text-right">
                  {headline.length}/100
                </div>
              </div>

              {/* Subheadline */}
              <div className="space-y-2">
                <Label htmlFor="subheadline" className="text-sm font-medium">
                  Subheadline (optional)
                </Label>
                <Textarea
                  id="subheadline"
                  value={subheadline}
                  onChange={(e) => setSubheadline(e.target.value)}
                  placeholder="Add a subheadline"
                  className="text-lg min-h-[3rem] resize-none"
                  maxLength={150}
                  rows={2}
                />
                <div className="text-xs text-muted-foreground text-right">
                  {subheadline.length}/150
                </div>
              </div>

              {/* Call to Action */}
              <div className="space-y-2">
                <Label htmlFor="cta" className="text-sm font-medium">
                  Call to Action
                </Label>
                <Textarea
                  id="cta"
                  value={cta}
                  onChange={(e) => setCta(e.target.value)}
                  placeholder="Scan to Learn More"
                  className="text-lg min-h-[3rem] resize-none"
                  maxLength={50}
                  rows={1}
                />
                <div className="text-xs text-muted-foreground text-right">
                  {cta.length}/50
                </div>
              </div>

              {/* Text Color Control */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Text Color</Label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setAutoTextColor(!autoTextColor)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-colors ${
                      autoTextColor
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded ${
                      autoTextColor ? 'bg-blue-500' : 'bg-gray-300'
                    }`} />
                    <span className="text-sm">Auto (based on background)</span>
                  </button>
                </div>

                {/* Manual color pickers */}
                {!autoTextColor && (
                  <div className="space-y-2 pt-2">
                    {['headline', 'subheadline', 'cta'].map(field => (
                      <div key={field} className="flex items-center gap-2">
                        <Label className="text-xs w-24 capitalize">{field}:</Label>
                        <button
                          onClick={() => setTextColors({ ...textColors, [field]: '#000000' })}
                          className={`w-8 h-8 rounded border-2 bg-black ${
                            textColors[field as keyof typeof textColors] === '#000000' ? 'border-blue-500' : 'border-gray-300'
                          }`}
                        />
                        <button
                          onClick={() => setTextColors({ ...textColors, [field]: '#FFFFFF' })}
                          className={`w-8 h-8 rounded border-2 bg-white ${
                            textColors[field as keyof typeof textColors] === '#FFFFFF' ? 'border-blue-500' : 'border-gray-300'
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                <p className="text-sm text-blue-900">
                  💡 Tip: Drag text boxes and QR code to reposition. Resize text horizontally or QR from any corner.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <Button
          onClick={onBack}
          variant="outline"
          className="min-h-[44px]"
          disabled={isGenerating}
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleGenerate}
          className="min-h-[44px]"
          disabled={isGenerating || !headline.trim()}
        >
          {isGenerating ? (
            <>Generating...</>
          ) : (
            <>
              Generate Asset
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* Styles for draggable elements */}
      <style>{`
        .draggable-text,
        .draggable-qr {
          border: 2px dashed transparent;
          transition: border-color 0.2s;
        }

        .draggable-text:hover,
        .draggable-qr:hover {
          border-color: rgba(59, 130, 246, 0.5);
          cursor: move;
        }

        .draggable-text.dragging,
        .draggable-qr.dragging {
          border-color: rgba(59, 130, 246, 0.8);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          opacity: 0.9;
        }

        /* Resize handle styles */
        .resize-handle-left,
        .resize-handle-right,
        .resize-handle-top,
        .resize-handle-bottom {
          opacity: 0;
          transition: opacity 0.2s;
        }

        .draggable-text:hover .resize-handle-left,
        .draggable-text:hover .resize-handle-right,
        .draggable-text:hover .resize-handle-top,
        .draggable-text:hover .resize-handle-bottom {
          opacity: 1;
        }

        .react-draggable-dragging .resize-handle-left,
        .react-draggable-dragging .resize-handle-right,
        .react-draggable-dragging .resize-handle-top,
        .react-draggable-dragging .resize-handle-bottom {
          opacity: 1;
          background: rgba(59, 130, 246, 0.4) !important;
        }

        .draggable-text.resizing,
        .draggable-qr.resizing {
          border-color: rgba(59, 130, 246, 1);
          border-style: solid;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
        }
      `}</style>
    </div>
  );
}
