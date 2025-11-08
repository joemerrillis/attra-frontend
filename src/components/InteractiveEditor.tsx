import { useState, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

// Default positions for 600px width x 900px height preview
const defaultTextPositions: TextPositions = {
  headline: {
    x: 40,
    y: 198,  // ~22% of 900px
    width: 520,
    fontSize: 36,
    fontWeight: 'bold',
  },
  subheadline: {
    x: 40,
    y: 324,  // ~36% of 900px
    width: 520,
    fontSize: 22,
    fontWeight: 'normal',
  },
  cta: {
    x: 40,
    y: 738,  // ~82% of 900px
    width: 520,
    fontSize: 22,
    fontWeight: 'bold',
  },
  qrCode: {
    x: 200,   // Center: (600-200)/2 = 200
    y: 350,   // Center: (900-200)/2 = 350
    size: 200,
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
  const { toast } = useToast();

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
   * Calculate optimal text color based on background brightness at position
   * Uses composition_map bright_zones and dark_zones from Sharp analysis
   */
  const getOptimalTextColor = (
    x: number,
    y: number,
    width: number,
    height: number
  ): string => {
    if (!compositionMap || !autoTextColor) {
      return '#000000'; // Default to black if no analysis or manual mode
    }

    const { bright_zones, dark_zones } = compositionMap;
    const textBox = { x, y, width, height };

    // Calculate overlap with dark and bright zones
    const darkOverlapArea = calculateOverlapArea(textBox, dark_zones || []);
    const brightOverlapArea = calculateOverlapArea(textBox, bright_zones || []);

    // If text overlaps more with dark zones, use white text
    // If text overlaps more with bright zones, use black text
    return darkOverlapArea > brightOverlapArea ? '#FFFFFF' : '#000000';
  };

  const updateTextPosition = (
    field: 'headline' | 'subheadline' | 'cta',
    updates: Partial<TextPositions[typeof field]>
  ) => {
    setTextPositions((prev) => {
      const newPosition = { ...prev[field], ...updates };

      // Update text color based on new position (if auto mode)
      if (autoTextColor) {
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

  // Initialize text colors based on composition map
  useEffect(() => {
    if (compositionMap && autoTextColor) {
      setTextColors({
        headline: getOptimalTextColor(
          defaultTextPositions.headline.x,
          defaultTextPositions.headline.y,
          defaultTextPositions.headline.width,
          80
        ),
        subheadline: getOptimalTextColor(
          defaultTextPositions.subheadline.x,
          defaultTextPositions.subheadline.y,
          defaultTextPositions.subheadline.width,
          60
        ),
        cta: getOptimalTextColor(
          defaultTextPositions.cta.x,
          defaultTextPositions.cta.y,
          defaultTextPositions.cta.width,
          60
        ),
      });
    }
  }, [compositionMap, autoTextColor]);

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
            <div
              className="relative bg-muted mx-auto"
              style={{
                width: '100%',
                maxWidth: '600px',
                aspectRatio: '2/3',
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
                <Rnd
                  position={{ x: textPositions.headline.x, y: textPositions.headline.y }}
                  size={{ width: textPositions.headline.width, height: 'auto' }}
                  onDragStart={() => setDraggingElement('headline')}
                  onDragStop={(_e, d) => {
                    setDraggingElement(null);
                    updateTextPosition('headline', { x: d.x, y: d.y });
                  }}
                  onResizeStart={() => setResizingElement('headline')}
                  onResizeStop={(_e, _direction, ref, _delta, position) => {
                    setResizingElement(null);
                    updateTextPosition('headline', {
                      x: position.x,
                      y: position.y,
                      width: ref.offsetWidth,
                    });
                  }}
                  bounds="parent"
                  enableResizing={{
                    left: true,
                    right: true,
                    top: false,
                    bottom: false,
                    topLeft: false,
                    topRight: false,
                    bottomLeft: false,
                    bottomRight: false,
                  }}
                  resizeHandleStyles={{
                    left: {
                      width: '12px',
                      height: '100%',
                      left: '-6px',
                      top: 0,
                      cursor: 'ew-resize',
                      background: 'rgba(59, 130, 246, 0.2)',
                      borderLeft: '3px solid rgba(59, 130, 246, 0.6)',
                    },
                    right: {
                      width: '12px',
                      height: '100%',
                      right: '-6px',
                      top: 0,
                      cursor: 'ew-resize',
                      background: 'rgba(59, 130, 246, 0.2)',
                      borderRight: '3px solid rgba(59, 130, 246, 0.6)',
                    },
                  }}
                  resizeHandleClasses={{
                    left: 'resize-handle-left',
                    right: 'resize-handle-right',
                  }}
                  minWidth={200}
                  className={`draggable-text ${draggingElement === 'headline' ? 'dragging' : ''} ${resizingElement === 'headline' ? 'resizing' : ''}`}
                >
                  <div
                    style={{
                      fontSize: `${textPositions.headline.fontSize}px`,
                      fontWeight: textPositions.headline.fontWeight,
                      color: textColors.headline,
                      fontFamily: 'Arial, sans-serif',
                      textAlign: 'center',
                      width: '100%',
                      cursor: draggingElement === 'headline' ? 'grabbing' : 'grab',
                      userSelect: 'none',
                      padding: '8px',
                      wordWrap: 'break-word',
                      textShadow: textColors.headline === '#FFFFFF'
                        ? '2px 2px 4px rgba(0,0,0,0.8)'
                        : 'none',
                    }}
                  >
                    {headline}
                  </div>
                </Rnd>
              )}

              {/* Draggable Subheadline */}
              {subheadline && (
                <Rnd
                  position={{ x: textPositions.subheadline.x, y: textPositions.subheadline.y }}
                  size={{ width: textPositions.subheadline.width, height: 'auto' }}
                  onDragStart={() => setDraggingElement('subheadline')}
                  onDragStop={(_e, d) => {
                    setDraggingElement(null);
                    updateTextPosition('subheadline', { x: d.x, y: d.y });
                  }}
                  onResizeStart={() => setResizingElement('subheadline')}
                  onResizeStop={(_e, _direction, ref, _delta, position) => {
                    setResizingElement(null);
                    updateTextPosition('subheadline', {
                      x: position.x,
                      y: position.y,
                      width: ref.offsetWidth,
                    });
                  }}
                  bounds="parent"
                  enableResizing={{
                    left: true,
                    right: true,
                    top: false,
                    bottom: false,
                    topLeft: false,
                    topRight: false,
                    bottomLeft: false,
                    bottomRight: false,
                  }}
                  resizeHandleStyles={{
                    left: {
                      width: '12px',
                      height: '100%',
                      left: '-6px',
                      top: 0,
                      cursor: 'ew-resize',
                      background: 'rgba(59, 130, 246, 0.2)',
                      borderLeft: '3px solid rgba(59, 130, 246, 0.6)',
                    },
                    right: {
                      width: '12px',
                      height: '100%',
                      right: '-6px',
                      top: 0,
                      cursor: 'ew-resize',
                      background: 'rgba(59, 130, 246, 0.2)',
                      borderRight: '3px solid rgba(59, 130, 246, 0.6)',
                    },
                  }}
                  resizeHandleClasses={{
                    left: 'resize-handle-left',
                    right: 'resize-handle-right',
                  }}
                  minWidth={200}
                  className={`draggable-text ${draggingElement === 'subheadline' ? 'dragging' : ''} ${resizingElement === 'subheadline' ? 'resizing' : ''}`}
                >
                  <div
                    style={{
                      fontSize: `${textPositions.subheadline.fontSize}px`,
                      fontWeight: textPositions.subheadline.fontWeight,
                      color: textColors.subheadline,
                      fontFamily: 'Arial, sans-serif',
                      textAlign: 'center',
                      width: '100%',
                      cursor: draggingElement === 'subheadline' ? 'grabbing' : 'grab',
                      userSelect: 'none',
                      padding: '8px',
                      wordWrap: 'break-word',
                      textShadow: textColors.subheadline === '#FFFFFF'
                        ? '2px 2px 4px rgba(0,0,0,0.8)'
                        : 'none',
                    }}
                  >
                    {subheadline}
                  </div>
                </Rnd>
              )}

              {/* Draggable QR Code */}
              <Rnd
                position={{ x: textPositions.qrCode.x, y: textPositions.qrCode.y }}
                size={{ width: textPositions.qrCode.size, height: textPositions.qrCode.size }}
                onDragStart={() => setDraggingElement('qrCode')}
                onDragStop={(_e, d) => {
                  setDraggingElement(null);
                  setTextPositions((prev) => ({
                    ...prev,
                    qrCode: { ...prev.qrCode, x: d.x, y: d.y },
                  }));
                }}
                onResizeStart={() => setResizingElement('qrCode')}
                onResizeStop={(_e, _direction, ref, _delta, position) => {
                  setResizingElement(null);
                  const newSize = ref.offsetWidth;
                  setTextPositions((prev) => ({
                    ...prev,
                    qrCode: { x: position.x, y: position.y, size: newSize },
                  }));
                }}
                bounds="parent"
                lockAspectRatio={true}
                enableResizing={{
                  top: true,
                  right: true,
                  bottom: true,
                  left: true,
                  topRight: true,
                  bottomRight: true,
                  bottomLeft: true,
                  topLeft: true,
                }}
                minWidth={150}
                minHeight={150}
                maxWidth={400}
                maxHeight={400}
                className={`draggable-qr ${draggingElement === 'qrCode' ? 'dragging' : ''} ${resizingElement === 'qrCode' ? 'resizing' : ''}`}
              >
                <div className="w-full h-full bg-white rounded-lg shadow-lg flex items-center justify-center border-4 border-gray-200">
                  <div className="w-[85%] h-[85%] bg-gradient-to-br from-gray-100 to-gray-200 rounded flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <div className="text-2xl mb-2">QR</div>
                      <div className="text-xs">Generated<br />in final asset</div>
                    </div>
                  </div>
                </div>
              </Rnd>

              {/* Draggable CTA */}
              {cta && (
                <Rnd
                  position={{ x: textPositions.cta.x, y: textPositions.cta.y }}
                  size={{ width: textPositions.cta.width, height: 'auto' }}
                  onDragStart={() => setDraggingElement('cta')}
                  onDragStop={(_e, d) => {
                    setDraggingElement(null);
                    updateTextPosition('cta', { x: d.x, y: d.y });
                  }}
                  onResizeStart={() => setResizingElement('cta')}
                  onResizeStop={(_e, _direction, ref, _delta, position) => {
                    setResizingElement(null);
                    updateTextPosition('cta', {
                      x: position.x,
                      y: position.y,
                      width: ref.offsetWidth,
                    });
                  }}
                  bounds="parent"
                  enableResizing={{
                    left: true,
                    right: true,
                    top: false,
                    bottom: false,
                    topLeft: false,
                    topRight: false,
                    bottomLeft: false,
                    bottomRight: false,
                  }}
                  resizeHandleStyles={{
                    left: {
                      width: '12px',
                      height: '100%',
                      left: '-6px',
                      top: 0,
                      cursor: 'ew-resize',
                      background: 'rgba(59, 130, 246, 0.2)',
                      borderLeft: '3px solid rgba(59, 130, 246, 0.6)',
                    },
                    right: {
                      width: '12px',
                      height: '100%',
                      right: '-6px',
                      top: 0,
                      cursor: 'ew-resize',
                      background: 'rgba(59, 130, 246, 0.2)',
                      borderRight: '3px solid rgba(59, 130, 246, 0.6)',
                    },
                  }}
                  resizeHandleClasses={{
                    left: 'resize-handle-left',
                    right: 'resize-handle-right',
                  }}
                  minWidth={200}
                  className={`draggable-text ${draggingElement === 'cta' ? 'dragging' : ''} ${resizingElement === 'cta' ? 'resizing' : ''}`}
                >
                  <div
                    style={{
                      fontSize: `${textPositions.cta.fontSize}px`,
                      fontWeight: textPositions.cta.fontWeight,
                      color: textColors.cta,
                      fontFamily: 'Arial, sans-serif',
                      textAlign: 'center',
                      width: '100%',
                      cursor: draggingElement === 'cta' ? 'grabbing' : 'grab',
                      userSelect: 'none',
                      padding: '8px',
                      wordWrap: 'break-word',
                      textShadow: textColors.cta === '#FFFFFF'
                        ? '2px 2px 4px rgba(0,0,0,0.8)'
                        : 'none',
                    }}
                  >
                    {cta}
                  </div>
                </Rnd>
              )}
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
                <Input
                  id="headline"
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Your Headline Here"
                  className="text-lg h-12"
                  maxLength={100}
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
                <Input
                  id="subheadline"
                  type="text"
                  value={subheadline}
                  onChange={(e) => setSubheadline(e.target.value)}
                  placeholder="Add a subheadline"
                  className="text-lg h-12"
                  maxLength={150}
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
                <Input
                  id="cta"
                  type="text"
                  value={cta}
                  onChange={(e) => setCta(e.target.value)}
                  placeholder="Scan to Learn More"
                  className="text-lg h-12"
                  maxLength={50}
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
        .resize-handle-right {
          opacity: 0;
          transition: opacity 0.2s;
        }

        .draggable-text:hover .resize-handle-left,
        .draggable-text:hover .resize-handle-right {
          opacity: 1;
        }

        .react-draggable-dragging .resize-handle-left,
        .react-draggable-dragging .resize-handle-right {
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
