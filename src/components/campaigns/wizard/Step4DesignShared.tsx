import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { LayoutType, CampaignCopy } from '@/types/campaign';

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
  layout: LayoutType;
  onLayoutChange: (layout: LayoutType) => void;
}

export function Step4DesignShared({
  destinationUrl,
  onDestinationUrlChange,
  copy,
  onCopyChange,
  layout,
  onLayoutChange
}: Step4DesignSharedProps) {
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

      {/* Layout Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Choose Layout</CardTitle>
          <CardDescription>
            Select a design style for your flyer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={layout} onValueChange={onLayoutChange}>
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
        </CardContent>
      </Card>
    </div>
  );
}
