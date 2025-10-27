import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

export function MapSimple() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    console.log('🗺️ Initializing simple map...');

    // Set token
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

    // Create map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/joemerrill/cmh9myy2j003y01sgfx33bnwj',
      center: [-98.5795, 39.8283],
      zoom: 3,
    });

    console.log('✅ Map initialized');

    return () => {
      console.log('🗺️ Cleaning up map...');
      map.current?.remove();
      map.current = null;
    };
  }, []);

  return (
    <div className="relative w-full h-screen">
      <h1 className="absolute top-4 left-4 z-10 bg-white px-4 py-2 rounded shadow">
        Simple Map Test
      </h1>
      <div
        ref={mapContainer}
        className="absolute inset-0"
      />
    </div>
  );
}
