import { useState } from 'react';
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
};

export function InteractiveEditor({
  backgroundUrl,
  onBack,
  onGenerate,
  isGenerating = false,
}: InteractiveEditorProps) {
  const [headline, setHeadline] = useState('Your Headline Here');
  const [subheadline, setSubheadline] = useState('');
  const [cta, setCta] = useState('Scan to Learn More');
  const [textPositions, setTextPositions] = useState<TextPositions>(defaultTextPositions);
  const [draggingElement, setDraggingElement] = useState<string | null>(null);
  const { toast } = useToast();

  const updateTextPosition = (
    field: 'headline' | 'subheadline' | 'cta',
    updates: Partial<TextPositions[typeof field]>
  ) => {
    setTextPositions((prev) => ({
      ...prev,
      [field]: { ...prev[field], ...updates },
    }));
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
                  onResizeStop={(_e, _direction, ref, _delta, position) => {
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
                  minWidth={200}
                  className={`draggable-text ${draggingElement === 'headline' ? 'dragging' : ''}`}
                >
                  <div
                    style={{
                      fontSize: `${textPositions.headline.fontSize}px`,
                      fontWeight: textPositions.headline.fontWeight,
                      color: '#000000',
                      fontFamily: 'Arial, sans-serif',
                      textAlign: 'center',
                      width: '100%',
                      cursor: 'move',
                      userSelect: 'none',
                      padding: '8px',
                      wordWrap: 'break-word',
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
                  onResizeStop={(_e, _direction, ref, _delta, position) => {
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
                  minWidth={200}
                  className={`draggable-text ${draggingElement === 'subheadline' ? 'dragging' : ''}`}
                >
                  <div
                    style={{
                      fontSize: `${textPositions.subheadline.fontSize}px`,
                      fontWeight: textPositions.subheadline.fontWeight,
                      color: '#000000',
                      fontFamily: 'Arial, sans-serif',
                      textAlign: 'center',
                      width: '100%',
                      cursor: 'move',
                      userSelect: 'none',
                      padding: '8px',
                      wordWrap: 'break-word',
                    }}
                  >
                    {subheadline}
                  </div>
                </Rnd>
              )}

              {/* QR Code Placeholder (Fixed, Not Draggable) */}
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{
                  width: 'clamp(200px, 40%, 300px)',
                  aspectRatio: '1/1',
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
                  onResizeStop={(_e, _direction, ref, _delta, position) => {
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
                  minWidth={200}
                  className={`draggable-text ${draggingElement === 'cta' ? 'dragging' : ''}`}
                >
                  <div
                    style={{
                      fontSize: `${textPositions.cta.fontSize}px`,
                      fontWeight: textPositions.cta.fontWeight,
                      color: '#000000',
                      fontFamily: 'Arial, sans-serif',
                      textAlign: 'center',
                      width: '100%',
                      cursor: 'move',
                      userSelect: 'none',
                      padding: '8px',
                      wordWrap: 'break-word',
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

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                <p className="text-sm text-blue-900">
                  💡 Tip: Drag text boxes to reposition. Resize horizontally to fit your message.
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

      {/* Styles for draggable text */}
      <style>{`
        .draggable-text {
          border: 2px dashed transparent;
          transition: border-color 0.2s;
        }

        .draggable-text:hover {
          border-color: rgba(59, 130, 246, 0.5);
        }

        .draggable-text.dragging {
          border-color: rgba(59, 130, 246, 0.8);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
}
