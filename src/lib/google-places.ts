// Extend the Window interface to include google
declare global {
  interface Window {
    google?: any;
  }
}

// Load Google Places Autocomplete
export const loadGooglePlaces = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve();
      return;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn('Google Maps API key not configured');
      reject(new Error('Google Maps API key not configured'));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });
};

// Parse Google Places result
export const parsePlaceResult = (place: any) => {
  const getComponent = (type: string) => {
    return place.address_components?.find((c: any) => c.types.includes(type))?.long_name || '';
  };

  return {
    address: place.formatted_address || '',
    city: getComponent('locality'),
    state: getComponent('administrative_area_level_1'),
    zipCode: getComponent('postal_code'),
    latitude: place.geometry?.location?.lat() || null,
    longitude: place.geometry?.location?.lng() || null,
  };
};
