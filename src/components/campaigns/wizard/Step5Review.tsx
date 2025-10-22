import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { MapPin, FileText, Target } from 'lucide-react';
import { locationApi } from '@/lib/location-api';
import type { WizardData } from '@/types/campaign';

interface Step5ReviewProps {
  data: WizardData;
}

export function Step5Review({ data }: Step5ReviewProps) {
  const { data: response } = useQuery({
    queryKey: ['locations', data.selectedLocations],
    queryFn: locationApi.list,
    enabled: data.selectedLocations.length > 0
  });

  // Extract locations from response
  const allLocations = (response as any)?.locations || (Array.isArray(response) ? response : []);
  const locations = allLocations.filter((loc: any) => data.selectedLocations.includes(loc.id));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Review & Generate</h2>
        <p className="text-muted-foreground">
          Review your campaign details before generating assets
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Campaign Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Goal */}
          <div>
            <p className="text-sm text-muted-foreground">Goal</p>
            <p className="font-medium capitalize">{data.goal?.replace('_', ' ')}</p>
          </div>

          <Separator />

          {/* Asset Type */}
          <div>
            <p className="text-sm text-muted-foreground">Asset Type</p>
            <p className="font-medium capitalize">{data.assetType?.replace('_', ' ')}</p>
          </div>

          <Separator />

          {/* Locations */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Locations ({data.selectedLocations.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {locations?.map((location: any) => (
                <Badge key={location.id} variant="secondary" className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {location.name}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Destination URL */}
          <div>
            <p className="text-sm text-muted-foreground">Destination URL</p>
            <p className="font-medium text-sm break-all">{data.destinationUrl}</p>
          </div>

          <Separator />

          {/* Customization Mode */}
          <div>
            <p className="text-sm text-muted-foreground">Copy Customization</p>
            <p className="font-medium">
              {data.customizePerLocation ? 'Per-location (customized for each)' : 'Shared (same for all)'}
            </p>
          </div>

          {/* Show copy preview if shared mode */}
          {!data.customizePerLocation && data.copy && (
            <>
              <Separator />
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium">Copy Preview:</p>
                <p className="text-lg font-bold">{data.copy.headline}</p>
                <p className="text-sm text-muted-foreground">{data.copy.subheadline}</p>
                <p className="text-sm font-medium text-primary">{data.copy.cta}</p>
              </div>
            </>
          )}

          <Separator />

          {/* Layout */}
          <div>
            <p className="text-sm text-muted-foreground">Layout</p>
            <p className="font-medium capitalize">{data.layout || (data.locationAssets?.[0]?.layout)}</p>
          </div>

          <Separator />

          {/* What will be created */}
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <p className="font-medium mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              What will be generated:
            </p>
            <ul className="space-y-2 text-sm">
              <li>✓ {data.selectedLocations.length} asset(s) with unique QR codes</li>
              <li>✓ Location-specific UTM tracking parameters</li>
              <li>✓ Print-ready PDFs (generated in ~3-5 seconds each)</li>
              <li>✓ Real-time scan tracking</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
        <CardContent className="p-4">
          <p className="text-sm text-yellow-900 dark:text-yellow-100">
            ⚠️ <strong>Note:</strong> After clicking "Generate Assets", the PDFs will be created
            in the background. You'll be redirected to the campaign page where you can download
            them once ready (usually within 10-15 seconds).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
