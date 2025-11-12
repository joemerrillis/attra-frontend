import { ArrowUp, ArrowDown, MoveUp, MoveDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LayerOrderingControlsProps {
  currentOrder: number;
  totalLayers: number;
  onMoveForward: () => void;    // +1
  onMoveBackward: () => void;   // -1
  onMoveToFront: () => void;    // Move to top
  onMoveToBack: () => void;     // Move to bottom
}

export function LayerOrderingControls({
  currentOrder,
  totalLayers,
  onMoveForward,
  onMoveBackward,
  onMoveToFront,
  onMoveToBack
}: LayerOrderingControlsProps) {
  const isTop = currentOrder === totalLayers - 1;
  const isBottom = currentOrder === 0;

  return (
    <div className="flex items-center gap-2 bg-white rounded-lg shadow-md p-2 border">
      <span className="text-xs text-gray-600 px-2">
        Layer {currentOrder + 1} of {totalLayers}
      </span>

      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMoveToBack}
          disabled={isBottom}
          title="Send to Back"
        >
          <MoveDown className="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onMoveBackward}
          disabled={isBottom}
          title="Move Backward"
        >
          <ArrowDown className="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onMoveForward}
          disabled={isTop}
          title="Move Forward"
        >
          <ArrowUp className="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onMoveToFront}
          disabled={isTop}
          title="Bring to Front"
        >
          <MoveUp className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
