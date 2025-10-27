import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface MapControlsProps {
  /** Handler for zoom in */
  onZoomIn: () => void;
  /** Handler for zoom out */
  onZoomOut: () => void;
  /** Handler for fit bounds (show all markers) */
  onFitBounds: () => void;
}

export function MapControls({
  onZoomIn,
  onZoomOut,
  onFitBounds,
}: MapControlsProps) {
  return (
    <div
      className="absolute bottom-24 right-4 z-10 flex flex-col gap-2"
      role="region"
      aria-label="Map controls"
    >
      <Button
        variant="secondary"
        size="icon"
        onClick={onZoomIn}
        aria-label="Zoom in"
        className="shadow-lg bg-background/95 backdrop-blur-sm hover:bg-accent hover:text-accent-foreground"
      >
        <ZoomIn className="w-5 h-5" aria-hidden="true" />
      </Button>

      <Button
        variant="secondary"
        size="icon"
        onClick={onZoomOut}
        aria-label="Zoom out"
        className="shadow-lg bg-background/95 backdrop-blur-sm hover:bg-accent hover:text-accent-foreground"
      >
        <ZoomOut className="w-5 h-5" aria-hidden="true" />
      </Button>

      <Button
        variant="secondary"
        size="icon"
        onClick={onFitBounds}
        aria-label="Show all locations"
        className="shadow-lg bg-background/95 backdrop-blur-sm hover:bg-accent hover:text-accent-foreground"
      >
        <Maximize2 className="w-5 h-5" aria-hidden="true" />
      </Button>
    </div>
  );
}
