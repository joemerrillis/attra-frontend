/**
 * BackgroundLibrary Component
 *
 * Grid display of tenant's AI-generated backgrounds
 * - Generate new backgrounds
 * - Filter by favorites
 * - Sort by recent/popular/favorites
 * - Preview and select backgrounds
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Sparkles, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { BackgroundCard } from './BackgroundCard';
import { BackgroundPreviewModal } from './BackgroundPreviewModal';
import type { Background } from '@/types/background';
import type { CampaignCopy } from '@/types/campaign';

interface BackgroundLibraryProps {
  selectedId?: string;
  onSelect: (backgroundId: string) => void;
  onGenerateNew?: () => void;
  compact?: boolean; // Smaller grid for per-location mode
  previewCopy?: CampaignCopy; // Show preview with campaign copy
  className?: string;
}

type SortOption = 'recent' | 'popular' | 'favorites';

export function BackgroundLibrary({
  selectedId,
  onSelect,
  onGenerateNew,
  compact = false,
  previewCopy,
  className = '',
}: BackgroundLibraryProps) {
  const queryClient = useQueryClient();
  const [sort, setSort] = useState<SortOption>('recent');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [previewBackground, setPreviewBackground] = useState<Background | null>(null);

  // TODO: Replace with actual API hook when created
  const { data: backgrounds = [], isLoading, error } = useQuery({
    queryKey: ['backgrounds', sort, favoritesOnly],
    queryFn: async () => {
      // Placeholder - will be replaced with actual API call
      return [] as Background[];
    },
  });

  // TODO: Replace with actual API hook when created
  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      // Placeholder - will be replaced with actual API call
      return { id, is_favorite: isFavorite };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backgrounds'] });
    },
  });

  const handleToggleFavorite = (background: Background, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavoriteMutation.mutate({
      id: background.id,
      isFavorite: !background.is_favorite,
    });
  };

  const handleCardClick = (background: Background) => {
    setPreviewBackground(background);
  };

  const handleSelectBackground = () => {
    if (previewBackground) {
      onSelect(previewBackground.id);
    }
  };

  const gridClassName = compact
    ? 'grid grid-cols-2 gap-3'
    : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4';

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        {/* Generate New Button */}
        {onGenerateNew && (
          <Button onClick={onGenerateNew} className="gap-2">
            <Sparkles className="w-4 h-4" />
            Generate New Background
          </Button>
        )}

        {/* Sort and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Favorites Only Toggle */}
          <div className="flex items-center gap-2">
            <Switch
              id="favorites-only"
              checked={favoritesOnly}
              onCheckedChange={setFavoritesOnly}
            />
            <Label htmlFor="favorites-only" className="text-sm">
              Favorites Only
            </Label>
          </div>

          {/* Sort Dropdown */}
          <Select value={sort} onValueChange={(value) => setSort(value as SortOption)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="popular">Most Used</SelectItem>
              <SelectItem value="favorites">Favorites</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            Failed to load backgrounds. Please try again.
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className={gridClassName}>
          {Array.from({ length: compact ? 4 : 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] rounded-lg" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && backgrounds.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
          <ImageIcon className="w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {favoritesOnly ? 'No Favorite Backgrounds' : 'No Backgrounds Yet'}
          </h3>
          <p className="text-muted-foreground text-center mb-4 max-w-md">
            {favoritesOnly
              ? 'Star backgrounds to add them to your favorites'
              : 'Generate your first AI background to get started'}
          </p>
          {onGenerateNew && !favoritesOnly && (
            <Button onClick={onGenerateNew} className="gap-2">
              <Sparkles className="w-4 h-4" />
              Generate Your First Background
            </Button>
          )}
          {favoritesOnly && (
            <Button variant="outline" onClick={() => setFavoritesOnly(false)}>
              Show All Backgrounds
            </Button>
          )}
        </div>
      )}

      {/* Background Grid */}
      {!isLoading && backgrounds.length > 0 && (
        <div className={gridClassName}>
          {backgrounds.map((background) => (
            <BackgroundCard
              key={background.id}
              background={background}
              selected={background.id === selectedId}
              onClick={() => handleCardClick(background)}
              onToggleFavorite={(e) => handleToggleFavorite(background, e)}
              compact={compact}
            />
          ))}
        </div>
      )}

      {/* Results Count */}
      {!isLoading && backgrounds.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing {backgrounds.length} background{backgrounds.length !== 1 ? 's' : ''}
          {favoritesOnly && ' (favorites only)'}
        </p>
      )}

      {/* Background Preview Modal */}
      <BackgroundPreviewModal
        background={previewBackground}
        isOpen={!!previewBackground}
        onClose={() => setPreviewBackground(null)}
        onSelect={handleSelectBackground}
        onToggleFavorite={() => {
          if (previewBackground) {
            toggleFavoriteMutation.mutate({
              id: previewBackground.id,
              isFavorite: !previewBackground.is_favorite,
            });
            // Update local state
            setPreviewBackground({
              ...previewBackground,
              is_favorite: !previewBackground.is_favorite,
            });
          }
        }}
        previewCopy={previewCopy}
      />
    </div>
  );
}
