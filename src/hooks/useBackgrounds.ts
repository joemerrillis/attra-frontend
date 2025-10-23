/**
 * useBackgrounds Hook
 *
 * React Query hook for fetching and managing backgrounds library
 * - List backgrounds with sorting/filtering
 * - Toggle favorites
 * - Delete backgrounds
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { backgroundsApi } from '@/lib/backgrounds-api';
import type { BackgroundsListResponse } from '@/types/background';

interface UseBackgroundsOptions {
  tenantId: string;
  sort?: 'recent' | 'popular' | 'favorites';
  favoritesOnly?: boolean;
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

export function useBackgrounds({
  tenantId,
  sort = 'recent',
  favoritesOnly = false,
  limit,
  offset,
  enabled = true,
}: UseBackgroundsOptions) {
  const queryClient = useQueryClient();

  // Fetch backgrounds list
  const query = useQuery<BackgroundsListResponse>({
    queryKey: ['backgrounds', tenantId, sort, favoritesOnly, limit, offset],
    queryFn: () =>
      backgroundsApi.list(tenantId, {
        sort,
        favorites_only: favoritesOnly,
        limit,
        offset,
      }),
    enabled: enabled && !!tenantId,
  });

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: ({ backgroundId, isFavorite }: { backgroundId: string; isFavorite: boolean }) =>
      backgroundsApi.toggleFavorite(backgroundId, isFavorite),
    onSuccess: () => {
      // Invalidate all backgrounds queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['backgrounds', tenantId] });
    },
  });

  // Delete background mutation
  const deleteMutation = useMutation({
    mutationFn: (backgroundId: string) => backgroundsApi.delete(backgroundId),
    onSuccess: () => {
      // Invalidate all backgrounds queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['backgrounds', tenantId] });
    },
  });

  return {
    // Query data
    backgrounds: query.data?.backgrounds || [],
    total: query.data?.total || 0,
    hasMore: query.data?.has_more || false,

    // Query state
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,

    // Mutations
    toggleFavorite: toggleFavoriteMutation.mutate,
    isTogglingFavorite: toggleFavoriteMutation.isPending,

    deleteBackground: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,

    // Utilities
    refetch: query.refetch,
  };
}
