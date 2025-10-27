import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2, Plus, Lock, Sparkles } from 'lucide-react';
import { locationApi } from '@/lib/location-api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useFeatureGate } from '@/hooks/useFeatureGate';
import { useNavigate } from 'react-router-dom';

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
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationAddress, setNewLocationAddress] = useState('');
  const [newLocationCity, setNewLocationCity] = useState('');
  const [newLocationState, setNewLocationState] = useState('');
  const [newLocationZip, setNewLocationZip] = useState('');

  // Feature gate check for bulk campaigns (multi-location)
  const { hasAccess: canSelectMultiple } = useFeatureGate('bulk_campaigns');
  const MAX_LOCATIONS_FREE = 1;

  const { data: response, isLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: locationApi.list
  });

  const createLocationMutation = useMutation({
    mutationFn: () => locationApi.create({
      name: newLocationName,
      address: newLocationAddress,
      city: newLocationCity,
      state: newLocationState,
      zip: newLocationZip,
    }),
    onSuccess: (response: any) => {
      const newLocation = response?.location || response;
      const newLocationId = newLocation?.id;

      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast({ title: 'Location created', description: `${newLocationName} has been added` });

      // Auto-select the newly created location
      if (newLocationId) {
        onChange([...value, newLocationId]);
      }

      // Reset form and close dialog
      setNewLocationName('');
      setNewLocationAddress('');
      setNewLocationCity('');
      setNewLocationState('');
      setNewLocationZip('');
      setShowCreateDialog(false);
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create location', description: error.message, variant: 'destructive' });
    }
  });

  // Extract locations from response (handle both direct array and wrapped response)
  const locations: Location[] = (response as any)?.locations || (Array.isArray(response) ? response : []);

  const toggleLocation = (locationId: string) => {
    if (value.includes(locationId)) {
      // Always allow deselecting
      onChange(value.filter(id => id !== locationId));
    } else {
      // Check if user can select more locations
      if (!canSelectMultiple && value.length >= MAX_LOCATIONS_FREE) {
        toast({
          title: 'Upgrade Required',
          description: 'Free plan is limited to 1 location per campaign. Upgrade to select multiple locations.',
          variant: 'default',
          action: (
            <Button size="sm" variant="default" onClick={() => navigate('/upgrade?feature=bulk_campaigns')}>
              <Sparkles className="w-3 h-3 mr-1" />
              Upgrade
            </Button>
          ),
        });
        return;
      }
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

  const handleCreateLocation = () => {
    if (newLocationName.trim()) {
      createLocationMutation.mutate();
    }
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
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Select Locations</h2>
          <p className="text-muted-foreground">
            Choose which locations will use this campaign
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>No Locations Found</CardTitle>
            <CardDescription>
              Create your first location to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Location
            </Button>
          </CardContent>
        </Card>

        {/* Create Location Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Location</DialogTitle>
              <DialogDescription>
                Add a business location for this campaign
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="location-name">Location Name <span className="text-destructive">*</span></Label>
                <Input
                  id="location-name"
                  placeholder="e.g., Main Street Store"
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location-address">Address</Label>
                <Input
                  id="location-address"
                  placeholder="123 Main St"
                  value={newLocationAddress}
                  onChange={(e) => setNewLocationAddress(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location-city">City</Label>
                  <Input
                    id="location-city"
                    placeholder="City"
                    value={newLocationCity}
                    onChange={(e) => setNewLocationCity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location-state">State</Label>
                  <Input
                    id="location-state"
                    placeholder="State"
                    value={newLocationState}
                    onChange={(e) => setNewLocationState(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location-zip">ZIP Code</Label>
                <Input
                  id="location-zip"
                  placeholder="12345"
                  value={newLocationZip}
                  onChange={(e) => setNewLocationZip(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateLocation}
                disabled={!newLocationName.trim() || createLocationMutation.isPending}
              >
                {createLocationMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Location'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Select Locations</h2>
          <p className="text-muted-foreground">
            Choose which locations will use this campaign
            {!canSelectMultiple && (
              <span className="text-xs ml-2 px-2 py-0.5 rounded bg-muted text-muted-foreground">
                Free: 1 location per campaign
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Location
          </Button>
          {canSelectMultiple ? (
            <>
              <Button variant="outline" size="sm" onClick={selectAll}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={clearAll}>
                Clear All
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/upgrade?feature=bulk_campaigns')}
              className="gap-1"
            >
              <Lock className="w-3 h-3" />
              Unlock Multi-Location
            </Button>
          )}
        </div>
      </div>

      <div className="text-sm text-muted-foreground mb-4">
        {value.length} of {locations.length} selected
        {!canSelectMultiple && value.length >= MAX_LOCATIONS_FREE && (
          <span className="ml-2 text-xs text-amber-600 dark:text-amber-500">
            (Limit reached - Upgrade to select more)
          </span>
        )}
      </div>

      <div className="grid gap-3">
        {locations.map((location) => {
          const isSelected = value.includes(location.id);
          const isLocked = !canSelectMultiple && !isSelected && value.length >= MAX_LOCATIONS_FREE;

          return (
            <Card
              key={location.id}
              className={`transition-all ${
                isLocked
                  ? 'opacity-50 cursor-not-allowed'
                  : `cursor-pointer hover:border-primary ${
                      isSelected ? 'border-primary bg-primary/5' : ''
                    }`
              }`}
              onClick={() => !isLocked && toggleLocation(location.id)}
            >
              <CardContent className="flex items-center space-x-4 p-4">
                <Checkbox
                  checked={isSelected}
                  disabled={isLocked}
                  onCheckedChange={() => !isLocked && toggleLocation(location.id)}
                />
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <Label className={`font-medium ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
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
                {isLocked && (
                  <Lock className="w-4 h-4 text-muted-foreground" />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create Location Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Location</DialogTitle>
            <DialogDescription>
              Add a business location for this campaign
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="location-name">Location Name <span className="text-destructive">*</span></Label>
              <Input
                id="location-name"
                placeholder="e.g., Main Street Store"
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location-address">Address</Label>
              <Input
                id="location-address"
                placeholder="123 Main St"
                value={newLocationAddress}
                onChange={(e) => setNewLocationAddress(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location-city">City</Label>
                <Input
                  id="location-city"
                  placeholder="City"
                  value={newLocationCity}
                  onChange={(e) => setNewLocationCity(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location-state">State</Label>
                <Input
                  id="location-state"
                  placeholder="State"
                  value={newLocationState}
                  onChange={(e) => setNewLocationState(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location-zip">ZIP Code</Label>
              <Input
                id="location-zip"
                placeholder="12345"
                value={newLocationZip}
                onChange={(e) => setNewLocationZip(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateLocation}
              disabled={!newLocationName.trim() || createLocationMutation.isPending}
            >
              {createLocationMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Location'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
