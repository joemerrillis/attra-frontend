import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2 } from 'lucide-react';
import { AIRefineCard } from './AIRefineCard';
import { useAIRefine } from '@/hooks/useAIRefine';

interface CopyEditorProps {
  copy: {
    headline: string;
    subheadline: string;
    cta: string;
  };
  onChange: (copy: any) => void;
  context: {
    goal: string;
    vertical: string;
    location: string;
  };
}

export function CopyEditor({ copy, onChange, context }: CopyEditorProps) {
  const [localCopy, setLocalCopy] = useState(copy);
  const { generate, variations, isRefining, clear } = useAIRefine();
  const [showVariations, setShowVariations] = useState(false);

  const handleChange = (field: string, value: string) => {
    const updated = { ...localCopy, [field]: value };
    setLocalCopy(updated);
    onChange(updated);
  };

  const handleAIGenerate = async () => {
    const results = await generate({
      goal: context.goal,
      vertical: context.vertical,
      location_name: context.location,
    });
    if (results && results.length > 0) {
      setShowVariations(true);
    }
  };

  const handleSelectVariation = (variation: { headline: string; subheadline: string }) => {
    const updated = {
      ...localCopy,
      headline: variation.headline,
      subheadline: variation.subheadline,
    };
    setLocalCopy(updated);
    onChange(updated);
    setShowVariations(false);
    clear();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Write your flyer copy</h2>
        <p className="text-muted-foreground">
          Create compelling copy, or let AI help you get started
        </p>
      </div>

      {/* AI Variations Preview */}
      {showVariations && variations.length > 0 && (
        <AIRefineCard
          variations={variations}
          onSelect={handleSelectVariation}
          onDismiss={() => {
            setShowVariations(false);
            clear();
          }}
        />
      )}

      {/* Manual Input Fields */}
      <div className="space-y-4">
        {/* Headline */}
        <div className="space-y-2">
          <Label htmlFor="headline">Headline *</Label>
          <Input
            id="headline"
            value={localCopy.headline}
            onChange={(e) => handleChange('headline', e.target.value)}
            placeholder="Your dog deserves better walks"
            maxLength={60}
          />
          <p className="text-xs text-muted-foreground">
            {localCopy.headline.length}/60 characters
          </p>
        </div>

        {/* Subheadline */}
        <div className="space-y-2">
          <Label htmlFor="subheadline">Subheadline *</Label>
          <Textarea
            id="subheadline"
            value={localCopy.subheadline}
            onChange={(e) => handleChange('subheadline', e.target.value)}
            placeholder="Professional dog walkers trusted by 200+ families"
            maxLength={120}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            {localCopy.subheadline.length}/120 characters
          </p>
        </div>

        {/* Call to Action */}
        <div className="space-y-2">
          <Label htmlFor="cta">Call to Action</Label>
          <Input
            id="cta"
            value={localCopy.cta}
            onChange={(e) => handleChange('cta', e.target.value)}
            placeholder="Book your first walk free"
            maxLength={40}
          />
          <p className="text-xs text-muted-foreground">
            {localCopy.cta.length}/40 characters
          </p>
        </div>
      </div>

      {/* AI Generate Button */}
      {!showVariations && (
        <Button
          variant="outline"
          onClick={handleAIGenerate}
          disabled={isRefining}
          className="w-full"
        >
          {isRefining ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating variations...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate AI Variations (Optional)
            </>
          )}
        </Button>
      )}

      <p className="text-xs text-muted-foreground text-center">
        AI can help you get started, but you can always write your own copy
      </p>
    </div>
  );
}
