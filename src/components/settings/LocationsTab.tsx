import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MapPin, Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { locationApi } from '@/lib/location-api';
import { useToast } from '@/hooks/use-toast';

interface Location {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  neighborhood?: string;
}

export function LocationsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [deletingLocation, setDeletingLocation] = useState<Location | null>(null);

  // Fetch locations
  const { data: response, isLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: () => locationApi.list(),
  });

  const locations: Location[] = Array.isArray(response) ? response : [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: locationApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setIsCreateOpen(false);
      toast({
        title: 'Location created',
        description: 'Your new location has been added',
      });
    },
    onError: () => {
      toast({
        title: 'Failed to create location',
        description: 'Please try again',
        variant: 'destructive',
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      locationApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setEditingLocation(null);
      toast({
        title: 'Location updated',
        description: 'Your changes have been saved',
      });
    },
    onError: () => {
      toast({
        title: 'Failed to update location',
        description: 'Please try again',
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: locationApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setDeletingLocation(null);
      toast({
        title: 'Location deleted',
        description: 'The location has been removed',
      });
    },
    onError: () => {
      toast({
        title: 'Failed to delete location',
        description: 'Please try again',
        variant: 'destructive',
      });
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Business Locations</CardTitle>
              <CardDescription>
                Manage your physical locations for QR code tracking
              </CardDescription>
            </div>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Location
                </Button>
              </DialogTrigger>
              <DialogContent>
                <LocationForm
                  onSubmit={(data) => createMutation.mutate(data)}
                  isLoading={createMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : locations.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No locations yet</h3>
              <p className="text-muted-foreground mb-4">
                Add your first business location to start creating campaigns
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Location
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {locations.map((location) => (
                <div
                  key={location.id}
                  className="flex items-start justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <h4 className="font-semibold">{location.name}</h4>
                      {(location.address || location.city || location.state) && (
                        <p className="text-sm text-muted-foreground">
                          {[
                            location.address,
                            location.city,
                            location.state,
                            location.zip,
                          ]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      )}
                      {location.neighborhood && (
                        <p className="text-xs text-muted-foreground">
                          {location.neighborhood}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingLocation(location)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingLocation(location)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingLocation && (
        <Dialog open={true} onOpenChange={() => setEditingLocation(null)}>
          <DialogContent>
            <LocationForm
              initialData={editingLocation}
              onSubmit={(data) =>
                updateMutation.mutate({ id: editingLocation.id, data })
              }
              isLoading={updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      {deletingLocation && (
        <AlertDialog open={true} onOpenChange={() => setDeletingLocation(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Location?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deletingLocation.name}"? This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteMutation.mutate(deletingLocation.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

interface LocationFormProps {
  initialData?: Partial<Location>;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

function LocationForm({ initialData, onSubmit, isLoading }: LocationFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    address: initialData?.address || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    zip: initialData?.zip || '',
    neighborhood: initialData?.neighborhood || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Remove empty string fields to send only provided values
    const cleanedData = Object.fromEntries(
      Object.entries(formData).filter(([_, value]) => value !== '')
    );
    console.log('Submitting location data:', cleanedData);
    onSubmit(cleanedData);
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>
          {initialData ? 'Edit Location' : 'Add New Location'}
        </DialogTitle>
        <DialogDescription>
          Enter the details for your business location
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="name">
            Location Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="Main Office"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Street Address</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => updateField('address', e.target.value)}
            placeholder="123 Main St"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => updateField('city', e.target.value)}
              placeholder="San Francisco"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              value={formData.state}
              onChange={(e) => updateField('state', e.target.value)}
              placeholder="CA"
              maxLength={2}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="zip">ZIP Code</Label>
            <Input
              id="zip"
              value={formData.zip}
              onChange={(e) => updateField('zip', e.target.value)}
              placeholder="94102"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="neighborhood">Neighborhood</Label>
            <Input
              id="neighborhood"
              value={formData.neighborhood}
              onChange={(e) => updateField('neighborhood', e.target.value)}
              placeholder="SOMA"
            />
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={!formData.name || isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : initialData ? (
            'Save Changes'
          ) : (
            'Create Location'
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
