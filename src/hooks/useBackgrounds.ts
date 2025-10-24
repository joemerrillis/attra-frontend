/**
 * useBackgrounds Hook
 *
 * React Query hook for fetching and managing backgrounds library
 * - List backgrounds with sorting/filtering
 * - Toggle favorites
 * - Delete backgrounds
 * - Realtime updates via Supabase
 */

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { backgroundsApi } from '@/lib/backgrounds-api';
import { supabase } from '@/lib/supabase';
import type { BackgroundsListResponse, Background } from '@/types/background';

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

  // Realtime subscription for new backgrounds
  useEffect(() => {
    if (!tenantId || !enabled) return;

    const channel = supabase
      .channel('backgrounds-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'campaign_backgrounds',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          // New background created - update cache optimistically
          queryClient.setQueryData<BackgroundsListResponse>(
            ['backgrounds', tenantId, sort, favoritesOnly, limit, offset],
            (oldData) => {
              if (!oldData) return oldData;

              return {
                ...oldData,
                backgrounds: [payload.new as Background, ...oldData.backgrounds],
                total: oldData.total + 1,
              };
            }
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'campaign_backgrounds',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          // Background updated (e.g., status changed) - update cache
          queryClient.setQueryData<BackgroundsListResponse>(
            ['backgrounds', tenantId, sort, favoritesOnly, limit, offset],
            (oldData) => {
              if (!oldData) return oldData;

              return {
                ...oldData,
                backgrounds: oldData.backgrounds.map((bg) =>
                  bg.id === (payload.new as Background).id ? (payload.new as Background) : bg
                ),
              };
            }
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'campaign_backgrounds',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          // Background deleted - update cache
          queryClient.setQueryData<BackgroundsListResponse>(
            ['backgrounds', tenantId, sort, favoritesOnly, limit, offset],
            (oldData) => {
              if (!oldData) return oldData;

              return {
                ...oldData,
                backgrounds: oldData.backgrounds.filter((bg) => bg.id !== (payload.old as Background).id),
                total: oldData.total - 1,
              };
            }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, enabled, queryClient, sort, favoritesOnly, limit, offset]);

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
