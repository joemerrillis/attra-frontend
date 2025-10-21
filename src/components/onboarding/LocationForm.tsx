import React, { useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loadGooglePlaces, parsePlaceResult } from '@/lib/google-places';

interface LocationData {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number | null;
  longitude: number | null;
}

interface LocationFormProps {
  location: LocationData;
  onLocationChange: (location: LocationData) => void;
}

export const LocationForm: React.FC<LocationFormProps> = ({
  location,
  onLocationChange,
}) => {
  const addressInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    initAutocomplete();
  }, []);

  const initAutocomplete = async () => {
    try {
      await loadGooglePlaces();

      if (addressInputRef.current && window.google) {
        const autocomplete = new google.maps.places.Autocomplete(
          addressInputRef.current,
          { types: ['address'] }
        );

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          const parsed = parsePlaceResult(place);

          onLocationChange({
            ...location,
            address: parsed.address,
            city: parsed.city,
            state: parsed.state,
            zipCode: parsed.zipCode,
            latitude: parsed.latitude,
            longitude: parsed.longitude,
          });
        });
      }
    } catch (error) {
      console.error('Failed to load Google Places:', error);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Your Business Location</h2>
      <p className="text-gray-600 mb-6">
        Where is your business located? This will be used for analytics and tracking.
      </p>

      <div className="space-y-4">
        <div>
          <Label htmlFor="locationName">Location Name *</Label>
          <Input
            id="locationName"
            value={location.name}
            onChange={(e) => onLocationChange({ ...location, name: e.target.value })}
            placeholder="Main Office"
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            A name for this business location (e.g., "Main Office", "Downtown Store")
          </p>
        </div>

        <div>
          <Label htmlFor="address">Address *</Label>
          <Input
            ref={addressInputRef}
            id="address"
            value={location.address}
            onChange={(e) => onLocationChange({ ...location, address: e.target.value })}
            placeholder="Start typing an address..."
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Google will autocomplete as you type
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={location.city}
              readOnly
              className="mt-1 bg-gray-50"
            />
          </div>
          <div>
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              value={location.state}
              readOnly
              className="mt-1 bg-gray-50"
            />
          </div>
          <div>
            <Label htmlFor="zipCode">ZIP</Label>
            <Input
              id="zipCode"
              value={location.zipCode}
              readOnly
              className="mt-1 bg-gray-50"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
