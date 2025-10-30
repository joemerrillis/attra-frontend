/**
 * BackgroundCard Component
 *
 * Thumbnail card for background library grid
 * - Click to preview
 * - Favorite toggle
 * - Usage badge
 * - Selected state
 */

import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Background } from '@/types/background';

interface BackgroundCardProps {
  background: Background;
  selected?: boolean;
  onClick: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
  compact?: boolean; // Smaller version for per-location mode
}

export function BackgroundCard({
  background,
  selected = false,
  onClick,
  onToggleFavorite,
  compact = false,
}: BackgroundCardProps) {
  return (
    <div
      className={cn(
        'relative rounded-lg overflow-hidden cursor-pointer transition-all duration-200',
        'hover:scale-105 hover:shadow-xl',
        selected
          ? 'ring-4 ring-primary shadow-2xl'
          : 'ring-1 ring-gray-200 hover:ring-2 hover:ring-gray-300',
        compact ? 'max-w-xs' : ''
      )}
      onClick={onClick}
    >
      {/* Thumbnail Image */}
      <img
        src={background.thumbnail_url}
        alt="Background"
        className={cn(
          'w-full',
          // On mobile: use object-contain to show full image
          // On desktop: use object-cover for better aesthetics
          'max-md:object-contain max-md:h-auto md:object-cover',
          compact ? 'aspect-[2/3]' : 'md:aspect-[2/3]'
        )}
        loading="lazy"
      />

      {/* Favorite Star Button */}
      <Button
        size="sm"
        variant="ghost"
        className={cn(
          'absolute top-2 right-2 bg-white/90 backdrop-blur-sm',
          'hover:bg-white hover:scale-110 transition-transform',
          'shadow-md'
        )}
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(e);
        }}
      >
        <Star
          className={cn(
            'w-4 h-4',
            background.is_favorite
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-400'
          )}
        />
      </Button>

      {/* Usage Badge */}
      {background.times_used > 0 && (
        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded shadow-md">
          Used {background.times_used}×
        </div>
      )}

      {/* Style Keywords Overlay */}
      {background.style_keywords.length > 0 && !compact && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <div className="flex flex-wrap gap-1">
            {background.style_keywords.slice(0, 3).map((keyword) => (
              <Badge
                key={keyword}
                variant="secondary"
                className="bg-white/90 text-xs"
              >
                {keyword}
              </Badge>
            ))}
            {background.style_keywords.length > 3 && (
              <Badge variant="secondary" className="bg-white/90 text-xs">
                +{background.style_keywords.length - 3}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Selected Indicator */}
      {selected && (
        <div className="absolute inset-0 bg-primary/10 backdrop-blur-[1px] flex items-center justify-center">
          <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full font-semibold shadow-lg">
            ✓ Selected
          </div>
        </div>
      )}
    </div>
  );
}
