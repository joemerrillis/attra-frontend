import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Moveable from 'react-moveable';
import { flushSync } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import type { TextElement, QRCodePosition, AssetTypeSpec, AssetType, TextPositions } from '@/types/asset';
import { useToast } from '@/hooks/use-toast';
import { DraggableTextBox } from './DraggableTextBox';
import { detectOverlappingElements } from '@/utils/geometryHelpers';

interface InteractiveEditorProps {
  assetType?: AssetType;
  assetSpec?: AssetTypeSpec;
  backgroundUrl: string;
  compositionMap: any | null;
  onBack: () => void;
  onGenerate: (data: {
    text_elements: TextElement[];
    qr_position: QRCodePosition;
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
  assetType = 'flyer',
  assetSpec,
  backgroundUrl,
  compositionMap,
  onBack,
  onGenerate,
  isGenerating = false,
}: InteractiveEditorProps) {
  // Use assetSpec dimensions if available, otherwise fallback to hardcoded flyer dimensions
  const ASSET_DIMENSIONS = assetSpec
    ? { width: assetSpec.width, height: assetSpec.height }
    : { width: 2550, height: 3300 };
  const DISPLAY_SCALE = 600 / ASSET_DIMENSIONS.width;

  // New dynamic state
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [qrPosition, setQRPosition] = useState<QRCodePosition>({
    x: Math.round(ASSET_DIMENSIONS.width * 0.35),
    y: Math.round(ASSET_DIMENSIONS.height * 0.45),
    size: Math.round(ASSET_DIMENSIONS.width * 0.33)
  });
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [draggingElementId, setDraggingElementId] = useState<string | null>(null);
  const [resizingElementId, setResizingElementId] = useState<string | null>(null);
  const [autoTextColor, setAutoTextColor] = useState(true);
  const [transformedZones, setTransformedZones] = useState<{
    bright_zones: any[];
    dark_zones: any[];
  } | null>(null);
  const { toast } = useToast();

  // QR code ref (still needed)
  const qrCodeRef = useRef<HTMLDivElement>(null);

  // Guideline positions (dynamic based on asset dimensions)
  const VERTICAL_GUIDELINES = [
    ASSET_DIMENSIONS.width * 0.25,
    ASSET_DIMENSIONS.width * 0.333,
    ASSET_DIMENSIONS.width * 0.5,
    ASSET_DIMENSIONS.width * 0.667,
    ASSET_DIMENSIONS.width * 0.75
  ];
  const HORIZONTAL_GUIDELINES = [
    ASSET_DIMENSIONS.height * 0.25,
    ASSET_DIMENSIONS.height * 0.333,
    ASSET_DIMENSIONS.height * 0.5,
    ASSET_DIMENSIONS.height * 0.667,
    ASSET_DIMENSIONS.height * 0.75
  ];

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
    // DIAGNOSTIC LOGGING
    console.log('[clampPosition] Input:', { x, y, width, height });
    console.log('[clampPosition] Canvas dimensions:', ASSET_DIMENSIONS);

    // Round to integers (Cloudinary may reject decimals)
    let clampedX = Math.round(x);
    let clampedY = Math.round(y);
    const roundedWidth = Math.round(width);

    // DIAGNOSTIC LOGGING
    console.log('[clampPosition] After rounding:', { clampedX, clampedY, roundedWidth });

    // Clamp to canvas bounds
    const maxX = ASSET_DIMENSIONS.width - roundedWidth;
    const maxY = ASSET_DIMENSIONS.height - (height === 'auto' ? 100 : Math.round(height));

    clampedX = Math.max(0, Math.min(clampedX, maxX));
    clampedY = Math.max(0, Math.min(clampedY, maxY));

    // DIAGNOSTIC LOGGING
    console.log('[clampPosition] Clamping bounds:', { maxX, maxY });
    console.log('[clampPosition] After clamping:', { clampedX, clampedY });

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

  const resetToDefaults = () => {
    // Reset text elements to defaults
    const defaultTextColors = {
      headline: transformedZones ? getOptimalTextColorFromZones(
        defaultTextPositions.headline.x,
        defaultTextPositions.headline.y,
        defaultTextPositions.headline.width,
        80,
        transformedZones.bright_zones,
        transformedZones.dark_zones
      ) : '#FFFFFF',
      subheadline: transformedZones ? getOptimalTextColorFromZones(
        defaultTextPositions.subheadline.x,
        defaultTextPositions.subheadline.y,
        defaultTextPositions.subheadline.width,
        60,
        transformedZones.bright_zones,
        transformedZones.dark_zones
      ) : '#FFFFFF',
      cta: transformedZones ? getOptimalTextColorFromZones(
        defaultTextPositions.cta.x,
        defaultTextPositions.cta.y,
        defaultTextPositions.cta.width,
        60,
        transformedZones.bright_zones,
        transformedZones.dark_zones
      ) : '#FFFFFF',
    };

    const defaultElements: TextElement[] = [
      {
        tempId: uuidv4(),
        type: 'headline',
        label: 'Headline',
        content: textElements.find(el => el.type === 'headline')?.content || 'Your Headline Here',
        position: {
          x: defaultTextPositions.headline.x,
          y: defaultTextPositions.headline.y,
          width: defaultTextPositions.headline.width,
          height: 'auto'
        },
        styling: {
          fontSize: defaultTextPositions.headline.fontSize,
          fontWeight: 'bold',
          textAlign: 'center',
          color: defaultTextColors.headline,
          italic: false,
          underline: false,
          letterSpacing: 0,
          lineSpacing: 10
        },
        constraints: { maxLength: 100, required: true },
        displayOrder: 0
      },
      {
        tempId: uuidv4(),
        type: 'subheadline',
        label: 'Subheadline',
        content: textElements.find(el => el.type === 'subheadline')?.content || '',
        position: {
          x: defaultTextPositions.subheadline.x,
          y: defaultTextPositions.subheadline.y,
          width: defaultTextPositions.subheadline.width,
          height: 'auto'
        },
        styling: {
          fontSize: defaultTextPositions.subheadline.fontSize,
          fontWeight: 'normal',
          textAlign: 'center',
          color: defaultTextColors.subheadline,
          italic: false,
          underline: false,
          letterSpacing: 0,
          lineSpacing: 10
        },
        constraints: { maxLength: 150, required: false },
        displayOrder: 1
      },
      {
        tempId: uuidv4(),
        type: 'cta',
        label: 'Call to Action',
        content: textElements.find(el => el.type === 'cta')?.content || 'Scan to Learn More',
        position: {
          x: defaultTextPositions.cta.x,
          y: defaultTextPositions.cta.y,
          width: defaultTextPositions.cta.width,
          height: 'auto'
        },
        styling: {
          fontSize: defaultTextPositions.cta.fontSize,
          fontWeight: 'bold',
          textAlign: 'center',
          color: defaultTextColors.cta,
          italic: false,
          underline: false,
          letterSpacing: 0,
          lineSpacing: 10
        },
        constraints: { maxLength: 50, required: true },
        displayOrder: 2
      }
    ];

    setTextElements(defaultElements);
    setQRPosition({
      x: Math.round(ASSET_DIMENSIONS.width * 0.35),
      y: Math.round(ASSET_DIMENSIONS.height * 0.45),
      size: Math.round(ASSET_DIMENSIONS.width * 0.33)
    });

    toast({
      title: 'Positions Reset',
      description: 'Text positions and QR code restored to defaults',
    });
  };

  const handleGenerate = () => {
    // Filter out empty text elements
    const nonEmptyElements = textElements.filter(el => el.content.trim() !== '');

    // Validate required elements
    const hasHeadline = nonEmptyElements.some(el =>
      el.type === 'headline' && el.content.trim() !== ''
    );

    if (!hasHeadline) {
      toast({
        title: 'Validation Error',
        description: 'Headline is required',
        variant: 'destructive'
      });
      return;
    }

    onGenerate({
      text_elements: nonEmptyElements,
      qr_position: qrPosition
    });
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
    }
  }, [compositionMap]);

  // Initialize default text elements from compositionMap
  useEffect(() => {
    if (!compositionMap || textElements.length > 0) return;

    const defaultTextColors = {
      headline: transformedZones ? getOptimalTextColorFromZones(
        defaultTextPositions.headline.x,
        defaultTextPositions.headline.y,
        defaultTextPositions.headline.width,
        80,
        transformedZones.bright_zones,
        transformedZones.dark_zones
      ) : '#FFFFFF',
      subheadline: transformedZones ? getOptimalTextColorFromZones(
        defaultTextPositions.subheadline.x,
        defaultTextPositions.subheadline.y,
        defaultTextPositions.subheadline.width,
        60,
        transformedZones.bright_zones,
        transformedZones.dark_zones
      ) : '#FFFFFF',
      cta: transformedZones ? getOptimalTextColorFromZones(
        defaultTextPositions.cta.x,
        defaultTextPositions.cta.y,
        defaultTextPositions.cta.width,
        60,
        transformedZones.bright_zones,
        transformedZones.dark_zones
      ) : '#FFFFFF',
    };

    const defaultElements: TextElement[] = [
      {
        tempId: uuidv4(),
        type: 'headline',
        label: 'Headline',
        content: 'Your Headline Here',
        position: {
          x: compositionMap?.headline?.x || defaultTextPositions.headline.x,
          y: compositionMap?.headline?.y || defaultTextPositions.headline.y,
          width: compositionMap?.headline?.width || defaultTextPositions.headline.width,
          height: 'auto'
        },
        styling: {
          fontSize: compositionMap?.headline?.fontSize || defaultTextPositions.headline.fontSize,
          fontWeight: 'bold',
          textAlign: 'center',
          color: defaultTextColors.headline,
          italic: false,
          underline: false,
          letterSpacing: 0,
          lineSpacing: 10
        },
        constraints: {
          maxLength: 100,
          required: true
        },
        displayOrder: 0
      },
      {
        tempId: uuidv4(),
        type: 'subheadline',
        label: 'Subheadline',
        content: '',
        position: {
          x: compositionMap?.subheadline?.x || defaultTextPositions.subheadline.x,
          y: compositionMap?.subheadline?.y || defaultTextPositions.subheadline.y,
          width: compositionMap?.subheadline?.width || defaultTextPositions.subheadline.width,
          height: 'auto'
        },
        styling: {
          fontSize: compositionMap?.subheadline?.fontSize || defaultTextPositions.subheadline.fontSize,
          fontWeight: 'normal',
          textAlign: 'center',
          color: defaultTextColors.subheadline,
          italic: false,
          underline: false,
          letterSpacing: 0,
          lineSpacing: 10
        },
        constraints: {
          maxLength: 150,
          required: false
        },
        displayOrder: 1
      },
      {
        tempId: uuidv4(),
        type: 'cta',
        label: 'Call to Action',
        content: 'Scan to Learn More',
        position: {
          x: compositionMap?.cta?.x || defaultTextPositions.cta.x,
          y: compositionMap?.cta?.y || defaultTextPositions.cta.y,
          width: compositionMap?.cta?.width || defaultTextPositions.cta.width,
          height: 'auto'
        },
        styling: {
          fontSize: compositionMap?.cta?.fontSize || defaultTextPositions.cta.fontSize,
          fontWeight: 'bold',
          textAlign: 'center',
          color: defaultTextColors.cta,
          italic: false,
          underline: false,
          letterSpacing: 0,
          lineSpacing: 10
        },
        constraints: {
          maxLength: 50,
          required: true
        },
        displayOrder: 2
      }
    ];

    setTextElements(defaultElements);
  }, [compositionMap, transformedZones, textElements.length]);

  // Text element update functions
  const updateTextElement = (id: string, updates: Partial<TextElement>) => {
    setTextElements(prev => prev.map(el =>
      el.tempId === id ? { ...el, ...updates } : el
    ));
  };

  const updateTextElementPosition = (id: string, position: Partial<TextElement['position']>) => {
    setTextElements(prev => prev.map(el =>
      el.tempId === id
        ? { ...el, position: { ...el.position, ...position } }
        : el
    ));
  };

  const updateTextElementStyling = (id: string, styling: Partial<TextElement['styling']>) => {
    setTextElements(prev => prev.map(el =>
      el.tempId === id
        ? { ...el, styling: { ...el.styling, ...styling } }
        : el
    ));
  };

  const updateTextElementContent = (id: string, content: string) => {
    setTextElements(prev => prev.map(el =>
      el.tempId === id ? { ...el, content } : el
    ));
  };

  const moveElementForward = (id: string) => {
    setTextElements(prev => {
      const index = prev.findIndex(el => el.tempId === id);
      if (index === -1 || index === prev.length - 1) return prev;

      const newElements = [...prev];
      const currentOrder = newElements[index].displayOrder;
      const nextElement = newElements.find(el => el.displayOrder === currentOrder + 1);

      if (nextElement) {
        newElements[index].displayOrder = currentOrder + 1;
        nextElement.displayOrder = currentOrder;
      }

      return newElements.sort((a, b) => a.displayOrder - b.displayOrder);
    });
  };

  const moveElementBackward = (id: string) => {
    setTextElements(prev => {
      const index = prev.findIndex(el => el.tempId === id);
      if (index === -1 || prev[index].displayOrder === 0) return prev;

      const newElements = [...prev];
      const currentOrder = newElements[index].displayOrder;
      const prevElement = newElements.find(el => el.displayOrder === currentOrder - 1);

      if (prevElement) {
        newElements[index].displayOrder = currentOrder - 1;
        prevElement.displayOrder = currentOrder;
      }

      return newElements.sort((a, b) => a.displayOrder - b.displayOrder);
    });
  };

  const moveElementToFront = (id: string) => {
    setTextElements(prev => {
      const maxOrder = Math.max(...prev.map(el => el.displayOrder));
      return prev.map(el =>
        el.tempId === id ? { ...el, displayOrder: maxOrder + 1 } : el
      ).sort((a, b) => a.displayOrder - b.displayOrder)
      .map((el, idx) => ({ ...el, displayOrder: idx }));
    });
  };

  const moveElementToBack = (id: string) => {
    setTextElements(prev => {
      return prev.map(el =>
        el.tempId === id ? { ...el, displayOrder: -1 } : el
      ).sort((a, b) => a.displayOrder - b.displayOrder)
      .map((el, idx) => ({ ...el, displayOrder: idx }));
    });
  };

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


              {/* Dynamic Text Elements */}
              {textElements.map((element) => {
                const overlappingIds = detectOverlappingElements(textElements, qrPosition);
                return (
                  <DraggableTextBox
                    key={element.tempId}
                    textElement={element}
                    onUpdate={updateTextElement}
                    isDragging={draggingElementId === element.tempId}
                    isResizing={resizingElementId === element.tempId}
                    isSelected={selectedElementId === element.tempId}
                    hasOverlap={overlappingIds.has(element.tempId)}
                    onDragStart={() => {
                      setDraggingElementId(element.tempId);
                      setSelectedElementId(element.tempId);
                    }}
                    onDragEnd={(left, top) => {
                      setDraggingElementId(null);
                      const clamped = clampPosition(left, top, element.position.width, element.position.height);
                      updateTextElementPosition(element.tempId, { x: clamped.x, y: clamped.y });
                    }}
                    onResizeStart={() => {
                      setResizingElementId(element.tempId);
                      setSelectedElementId(element.tempId);
                    }}
                    onResizeEnd={(width, height, left, top) => {
                      setResizingElementId(null);
                      const clamped = clampPosition(left, top, width, height);
                      updateTextElementPosition(element.tempId, {
                        x: clamped.x,
                        y: clamped.y,
                        width: Math.round(width),
                        height: height === 'auto' ? 'auto' : Math.round(height)
                      });
                    }}
                    bounds={{ left: 0, top: 0, right: ASSET_DIMENSIONS.width, bottom: ASSET_DIMENSIONS.height }}
                    verticalGuidelines={VERTICAL_GUIDELINES}
                    horizontalGuidelines={HORIZONTAL_GUIDELINES}
                  />
                );
              })}

              {/* Draggable QR Code */}
              <>
                <div
                  ref={qrCodeRef}
                  className={`draggable-qr ${draggingElementId === 'qrCode' ? 'dragging' : ''} ${resizingElementId === 'qrCode' ? 'resizing' : ''}`}
                  style={{
                    position: 'absolute',
                    left: `${qrPosition.x}px`,
                    top: `${qrPosition.y}px`,
                    width: `${qrPosition.size}px`,
                    height: `${qrPosition.size}px`,
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
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Controls Panel */}
        <div className="flex-1 lg:w-[40%]">
          <Card className="p-4 md:p-6">
            <h3 className="text-lg font-semibold mb-4">Edit Your Text</h3>

            <div className="space-y-4">
              {/* Element Selector */}
              {textElements.length > 0 && (
                <>
                  {textElements.map((element) => (
                    <div
                      key={element.tempId}
                      className={`space-y-2 p-3 rounded-lg border-2 ${
                        selectedElementId === element.tempId
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white'
                      }`}
                      onClick={() => setSelectedElementId(element.tempId)}
                    >
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">
                          {element.label} {element.constraints?.required && '*'}
                        </Label>
                        <span className="text-xs text-gray-500">
                          Layer {element.displayOrder + 1}
                        </span>
                      </div>

                      <Textarea
                        value={element.content}
                        onChange={(e) => updateTextElementContent(element.tempId, e.target.value)}
                        placeholder={`Enter ${element.label.toLowerCase()}...`}
                        className="text-lg min-h-[3rem] resize-none"
                        maxLength={element.constraints?.maxLength || 500}
                        rows={2}
                      />
                      <div className="text-xs text-muted-foreground text-right">
                        {element.content.length}/{element.constraints?.maxLength || 500}
                      </div>
                    </div>
                  ))}
                </>
              )}

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
                {!autoTextColor && selectedElementId && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs w-24">Color:</Label>
                      <button
                        onClick={() => {
                          const element = textElements.find(el => el.tempId === selectedElementId);
                          if (element) {
                            updateTextElementStyling(selectedElementId, { color: '#000000' });
                          }
                        }}
                        className={`w-8 h-8 rounded border-2 bg-black ${
                          textElements.find(el => el.tempId === selectedElementId)?.styling.color === '#000000'
                            ? 'border-blue-500'
                            : 'border-gray-300'
                        }`}
                      />
                      <button
                        onClick={() => {
                          const element = textElements.find(el => el.tempId === selectedElementId);
                          if (element) {
                            updateTextElementStyling(selectedElementId, { color: '#FFFFFF' });
                          }
                        }}
                        className={`w-8 h-8 rounded border-2 bg-white ${
                          textElements.find(el => el.tempId === selectedElementId)?.styling.color === '#FFFFFF'
                            ? 'border-blue-500'
                            : 'border-gray-300'
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                <p className="text-sm text-blue-900">
                  💡 Tip: Click a text box to select it, then edit here. Drag to reposition, resize from edges.
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
