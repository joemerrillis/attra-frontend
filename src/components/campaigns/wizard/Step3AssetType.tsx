import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import type { AssetType } from '@/types/campaign';
import { FileText, Home, UtensilsCrossed, CreditCard, Signpost } from 'lucide-react';

const ASSET_TYPES: Array<{
  value: AssetType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    value: 'flyer',
    label: 'Flyer',
    description: 'Standard 8.5x11 promotional flyer',
    icon: FileText
  },
  {
    value: 'door_hanger',
    label: 'Door Hanger',
    description: 'Door-to-door marketing material',
    icon: Home
  },
  {
    value: 'table_tent',
    label: 'Table Tent',
    description: 'Folded tabletop display',
    icon: UtensilsCrossed
  },
  {
    value: 'business_card',
    label: 'Business Card',
    description: 'Standard business card format',
    icon: CreditCard
  },
  {
    value: 'menu_board',
    label: 'Menu Board',
    description: 'Restaurant menu or price list',
    icon: Signpost
  }
];

interface Step3AssetTypeProps {
  assetType?: AssetType;
  onAssetTypeChange: (type: AssetType) => void;
  customizePerLocation: boolean;
  onCustomizeChange: (customize: boolean) => void;
}

export function Step3AssetType({
  assetType,
  onAssetTypeChange,
  customizePerLocation,
  onCustomizeChange
}: Step3AssetTypeProps) {
  return (
    <div className="space-y-8">
      {/* Asset Type Selection */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Choose Asset Type</h2>
          <p className="text-muted-foreground">
            What type of marketing material are you creating?
          </p>
        </div>

        <RadioGroup value={assetType} onValueChange={onAssetTypeChange}>
          <div className="grid gap-4">
            {ASSET_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = assetType === type.value;

              return (
                <Card
                  key={type.value}
                  className={`cursor-pointer transition-all hover:border-primary ${
                    isSelected ? 'border-primary ring-2 ring-primary ring-offset-2' : ''
                  }`}
                  onClick={() => onAssetTypeChange(type.value)}
                >
                  <CardHeader className="flex flex-row items-center space-x-4 pb-2">
                    <RadioGroupItem value={type.value} id={type.value} />
                    <Icon className="w-6 h-6 text-primary" />
                    <div className="flex-1">
                      <Label htmlFor={type.value} className="cursor-pointer">
                        <CardTitle className="text-lg">{type.label}</CardTitle>
                      </Label>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{type.description}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </RadioGroup>
      </div>

      <Separator />

      {/* Customization Toggle */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold mb-2">Customization Options</h3>
          <p className="text-muted-foreground text-sm">
            Do you want the same copy for all locations, or customize for each?
          </p>
        </div>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div className="space-y-1">
              <Label htmlFor="customize-toggle" className="text-base font-medium">
                Customize copy for each location
              </Label>
              <p className="text-sm text-muted-foreground">
                {customizePerLocation
                  ? 'You\'ll design separately for each location'
                  : 'Same headline, subheadline, and CTA for all locations'}
              </p>
            </div>
            <Switch
              id="customize-toggle"
              checked={customizePerLocation}
              onCheckedChange={onCustomizeChange}
            />
          </CardContent>
        </Card>

        {customizePerLocation && (
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
            <CardContent className="p-4">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                💡 <strong>Per-location mode:</strong> You'll be able to customize the headline,
                subheadline, CTA, and layout for each selected location individually.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
