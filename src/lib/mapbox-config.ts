import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Initialize Mapbox token
export function initMapbox() {
  const token = import.meta.env.VITE_MAPBOX_TOKEN;

  if (!token) {
    console.error('VITE_MAPBOX_TOKEN not set');
    return false;
  }

  mapboxgl.accessToken = token;
  return true;
}

// Default map config
export const DEFAULT_MAP_CONFIG = {
  style: 'mapbox://styles/joemerrill/cmh9myy2j003y01sgfx33bnwj',
  center: [-98.5795, 39.8283] as [number, number], // Center of USA
  zoom: 3,
  minZoom: 2,
  maxZoom: 18,
};

// Map theme based on user's brand color
export function getMapStyle(_primaryColor?: string) {
  // Use custom Attra map style
  // Future: customize based on tenant branding
  return 'mapbox://styles/joemerrill/cmh9myy2j003y01sgfx33bnwj';
}

// Create custom marker element
export function createPinMarker(scanCount: number, isPulsing: boolean = false) {
  const el = document.createElement('div');
  el.className = `map-pin ${isPulsing ? 'pulsing' : ''}`;
  el.style.cssText = `
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #4F46E5;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    font-size: 14px;
    cursor: pointer;
    transition: transform 0.2s;
  `;

  if (isPulsing) {
    el.style.animation = 'pulse 2s infinite';
  }

  el.textContent = scanCount > 99 ? '99+' : scanCount.toString();

  el.addEventListener('mouseenter', () => {
    el.style.transform = 'scale(1.2)';
  });

  el.addEventListener('mouseleave', () => {
    el.style.transform = 'scale(1)';
  });

  return el;
}

// Add pulse animation CSS
export function addMapStyles() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0%, 100% {
        box-shadow: 0 2px 8px rgba(0,0,0,0.2), 0 0 0 0 rgba(79, 70, 229, 0.7);
      }
      50% {
        box-shadow: 0 2px 8px rgba(0,0,0,0.2), 0 0 0 20px rgba(79, 70, 229, 0);
      }
    }

    .mapboxgl-popup-content {
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .mapboxgl-popup-close-button {
      font-size: 20px;
      padding: 4px 8px;
    }
  `;
  document.head.appendChild(style);
}
