import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Palette, Check } from 'lucide-react';
import { BackgroundLibrary } from '@/components/campaigns/BackgroundLibrary';
import { useBackgroundGeneration } from '@/hooks/useBackgroundGeneration';
import { useBackgrounds } from '@/hooks/useBackgrounds';
import { useAuth } from '@/hooks/useAuth';
import { formatRelativeTime } from '@/lib/utils';
import type { LayoutType, CampaignCopy } from '@/types/campaign';
import type { Background } from '@/types/background';

const LAYOUTS: Array<{
  value: LayoutType;
  label: string;
  description: string;
}> = [
  {
    value: 'classic',
    label: 'Classic',
    description: 'Traditional layout with elegant styling'
  },
  {
    value: 'modern',
    label: 'Modern',
    description: 'Clean, contemporary design with bold typography'
  },
  {
    value: 'minimal',
    label: 'Minimal',
    description: 'Simple and understated with maximum impact'
  }
];

interface Step4DesignSharedProps {
  destinationUrl: string;
  onDestinationUrlChange: (url: string) => void;
  copy: CampaignCopy;
  onCopyChange: (copy: CampaignCopy) => void;
  layout?: LayoutType;
  onLayoutChange: (layout: LayoutType) => void;
  backgroundId?: string;
  onBackgroundIdChange: (backgroundId: string | undefined) => void;
}

export function Step4DesignShared({
  destinationUrl,
  onDestinationUrlChange,
  copy,
  onCopyChange,
  layout,
  onLayoutChange,
  backgroundId,
  onBackgroundIdChange
}: Step4DesignSharedProps) {
  const { tenant } = useAuth();
  // Default to AI backgrounds to showcase the feature
  const [designMode, setDesignMode] = useState<'ai' | 'classic'>('ai');

  const { generate, isGenerating } = useBackgroundGeneration({
    tenantId: tenant?.id || '',
    onSuccess: (background: Background) => {
      onBackgroundIdChange(background.id);
      setDesignMode('ai');
    },
  });

  // Fetch backgrounds to show featured AI background
  const { backgrounds } = useBackgrounds({
    tenantId: tenant?.id || '',
    sort: 'recent',
    enabled: !!tenant?.id && designMode === 'ai',
  });

  // Get most recent AI background
  const aiBackground = backgrounds?.[0];

  // Check if background was recently generated (within last hour)
  const isRecentlyGenerated = aiBackground &&
    (Date.now() - new Date(aiBackground.created_at).getTime()) < 3600000;

  const handleSelectBackground = (id: string) => {
    onBackgroundIdChange(id);
    setDesignMode('ai');
  };

  const handleSelectAIBackground = () => {
    if (aiBackground) {
      onBackgroundIdChange(aiBackground.id);
    }
  };

  const handleGenerateNew = () => {
    generate(undefined);
  };

  const handleTabChange = (value: string) => {
    const mode = value as 'ai' | 'classic';
    setDesignMode(mode);

    if (mode === 'classic') {
      // Clear background selection and ensure layout is set
      onBackgroundIdChange(undefined);
      if (!layout) {
        onLayoutChange('modern');
      }
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Design Your Campaign</h2>
        <p className="text-muted-foreground">
          This copy will be used for all selected locations
        </p>
      </div>

      {/* Destination URL */}
      <Card>
        <CardHeader>
          <CardTitle>Destination URL</CardTitle>
          <CardDescription>
            Where should QR codes redirect to?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="destination-url">URL</Label>
            <Input
              id="destination-url"
              type="url"
              placeholder="https://example.com/promo"
              value={destinationUrl}
              onChange={(e) => onDestinationUrlChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              UTM parameters will be added automatically for tracking
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Copy Fields */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Copy</CardTitle>
          <CardDescription>
            Write the text that will appear on your flyer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Headline */}
          <div className="space-y-2">
            <Label htmlFor="headline">
              Headline <span className="text-xs text-muted-foreground">(max 60 characters)</span>
            </Label>
            <Input
              id="headline"
              placeholder="Free Walk Guarantee"
              value={copy.headline}
              onChange={(e) => onCopyChange({ ...copy, headline: e.target.value })}
              maxLength={60}
            />
            <p className="text-xs text-muted-foreground text-right">
              {copy.headline?.length || 0} / 60
            </p>
          </div>

          {/* Subheadline */}
          <div className="space-y-2">
            <Label htmlFor="subheadline">
              Subheadline <span className="text-xs text-muted-foreground">(max 120 characters)</span>
            </Label>
            <Textarea
              id="subheadline"
              placeholder="We respond in 3 hours or your walk is free"
              value={copy.subheadline}
              onChange={(e) => onCopyChange({ ...copy, subheadline: e.target.value })}
              maxLength={120}
              rows={2}
            />
            <p className="text-xs text-muted-foreground text-right">
              {copy.subheadline?.length || 0} / 120
            </p>
          </div>

          {/* CTA */}
          <div className="space-y-2">
            <Label htmlFor="cta">
              Call to Action <span className="text-xs text-muted-foreground">(max 40 characters)</span>
            </Label>
            <Input
              id="cta"
              placeholder="Text WALK to 555-1234"
              value={copy.cta}
              onChange={(e) => onCopyChange({ ...copy, cta: e.target.value })}
              maxLength={40}
            />
            <p className="text-xs text-muted-foreground text-right">
              {copy.cta?.length || 0} / 40
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Background Selection: AI vs Classic Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Choose Background Style</CardTitle>
          <CardDescription>
            Use AI-generated backgrounds or classic HTML templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={designMode} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="ai" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                AI Backgrounds
                <Badge variant="secondary" className="ml-1 text-xs">Recommended</Badge>
              </TabsTrigger>
              <TabsTrigger value="classic" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Classic Templates
              </TabsTrigger>
            </TabsList>

            {/* AI Backgrounds Tab */}
            <TabsContent value="ai" className="space-y-4">
              {/* FEATURED: Your AI Background */}
              {aiBackground && (
                <>
                  <div className="border-2 border-blue-300 rounded-xl p-6 bg-gradient-to-br from-blue-50 to-purple-50 shadow-lg">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <Sparkles className="w-6 h-6 text-white" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-gray-900">Your AI Background</h3>
                          {isRecentlyGenerated && (
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                              NEW
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 mb-3">
                          Custom-generated based on your brand assets
                          {aiBackground.created_at && (
                            <span className="text-gray-500">
                              {' '}• Generated {formatRelativeTime(aiBackground.created_at)}
                            </span>
                          )}
                        </p>

                        {/* Preview */}
                        <div className="relative rounded-lg overflow-hidden mb-3" style={{ aspectRatio: '16/9' }}>
                          <img
                            src={aiBackground.image_url}
                            alt="Your AI-generated background"
                            className="w-full h-full object-cover"
                          />
                          {backgroundId === aiBackground.id && (
                            <div className="absolute inset-0 bg-blue-500/20 border-4 border-blue-500 flex items-center justify-center">
                              <div className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                                <Check className="w-5 h-5" />
                                Selected
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action Button */}
                        <Button
                          onClick={handleSelectAIBackground}
                          disabled={backgroundId === aiBackground.id}
                          className={
                            backgroundId === aiBackground.id
                              ? 'w-full'
                              : 'w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                          }
                          variant={backgroundId === aiBackground.id ? 'secondary' : 'default'}
                        >
                          {backgroundId === aiBackground.id
                            ? '✓ Currently Selected'
                            : 'Use This Background'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-gray-500">Or choose from library</span>
                    </div>
                  </div>
                </>
              )}

              <BackgroundLibrary
                selectedId={backgroundId}
                onSelect={handleSelectBackground}
                onGenerateNew={handleGenerateNew}
                isGenerating={isGenerating}
                previewCopy={copy}
              />
            </TabsContent>
            {/* Classic Templates Tab */}
            <TabsContent value="classic" className="space-y-4">
              <RadioGroup value={layout || 'modern'} onValueChange={onLayoutChange}>
                <div className="grid gap-4">
                  {LAYOUTS.map((layoutOption) => {
                    const isSelected = layout === layoutOption.value;

                    return (
                      <Card
                        key={layoutOption.value}
                        className={`cursor-pointer transition-all hover:border-primary ${
                          isSelected ? 'border-primary ring-2 ring-primary ring-offset-2' : ''
                        }`}
                        onClick={() => onLayoutChange(layoutOption.value)}
                      >
                        <CardHeader className="flex flex-row items-center space-x-4 pb-2">
                          <RadioGroupItem value={layoutOption.value} id={layoutOption.value} />
                          <div className="flex-1">
                            <Label htmlFor={layoutOption.value} className="cursor-pointer">
                              <CardTitle className="text-base">{layoutOption.label}</CardTitle>
                            </Label>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <CardDescription>{layoutOption.description}</CardDescription>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </RadioGroup>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
