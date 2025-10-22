import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2 } from 'lucide-react';
import { locationApi } from '@/lib/location-api';

interface Location {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
}

interface Step2LocationsProps {
  value: string[];
  onChange: (locationIds: string[]) => void;
}

export function Step2Locations({ value, onChange }: Step2LocationsProps) {
  const { data: response, isLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: locationApi.list
  });

  // Extract locations from response (handle both direct array and wrapped response)
  const locations: Location[] = (response as any)?.locations || (Array.isArray(response) ? response : []);

  const toggleLocation = (locationId: string) => {
    if (value.includes(locationId)) {
      onChange(value.filter(id => id !== locationId));
    } else {
      onChange([...value, locationId]);
    }
  };

  const selectAll = () => {
    if (locations) {
      onChange(locations.map(loc => loc.id));
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!locations || locations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Locations Found</CardTitle>
          <CardDescription>
            You need to create at least one location before creating a campaign.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Select Locations</h2>
          <p className="text-muted-foreground">
            Choose which locations will use this campaign
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={selectAll}>
            Select All
          </Button>
          <Button variant="outline" size="sm" onClick={clearAll}>
            Clear All
          </Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground mb-4">
        {value.length} of {locations.length} selected
      </div>

      <div className="grid gap-3">
        {locations.map((location) => {
          const isSelected = value.includes(location.id);

          return (
            <Card
              key={location.id}
              className={`cursor-pointer transition-all hover:border-primary ${
                isSelected ? 'border-primary bg-primary/5' : ''
              }`}
              onClick={() => toggleLocation(location.id)}
            >
              <CardContent className="flex items-center space-x-4 p-4">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleLocation(location.id)}
                />
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <Label className="cursor-pointer font-medium">
                    {location.name}
                  </Label>
                  {location.address && (
                    <p className="text-sm text-muted-foreground">
                      {location.address}
                      {location.city && `, ${location.city}`}
                      {location.state && `, ${location.state}`}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
