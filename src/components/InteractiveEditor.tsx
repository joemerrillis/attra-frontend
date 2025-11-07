import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { TextOverlay } from './TextOverlay';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface InteractiveEditorProps {
  backgroundUrl: string;
  onBack: () => void;
  onGenerate: (data: { headline: string; subheadline: string; cta: string }) => void;
  isGenerating?: boolean;
}

export function InteractiveEditor({
  backgroundUrl,
  onBack,
  onGenerate,
  isGenerating = false,
}: InteractiveEditorProps) {
  const [headline, setHeadline] = useState('Your Headline Here');
  const [subheadline, setSubheadline] = useState('');
  const [cta, setCta] = useState('Scan to Learn More');

  const handleGenerate = () => {
    onGenerate({ headline, subheadline, cta });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Preview Panel */}
        <div className="flex-1 lg:w-[60%]">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Preview</h3>
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

              {/* Text Overlays */}
              <TextOverlay
                text={headline}
                style={{
                  top: '22%',
                  fontSize: 'clamp(24px, 5vw, 48px)',
                  fontWeight: 'bold',
                  maxWidth: 'calc(100% - 80px)',
                }}
              />

              {subheadline && (
                <TextOverlay
                  text={subheadline}
                  style={{
                    top: '36%',
                    fontSize: 'clamp(16px, 3vw, 28px)',
                    fontWeight: 'normal',
                    maxWidth: 'calc(100% - 80px)',
                  }}
                />
              )}

              {/* QR Code Placeholder */}
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

              <TextOverlay
                text={cta}
                style={{
                  bottom: '18%',
                  fontSize: 'clamp(16px, 3vw, 28px)',
                  fontWeight: 'bold',
                  maxWidth: 'calc(100% - 80px)',
                }}
              />
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
    </div>
  );
}
