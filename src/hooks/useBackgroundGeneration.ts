/**
 * useBackgroundGeneration Hook
 *
 * React Query hook for AI background generation with status polling
 * - Start generation
 * - Poll for completion
 * - Auto-refetch backgrounds list on success
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { backgroundsApi } from '@/lib/backgrounds-api';
import type { BackgroundGenerationRequest, Background } from '@/types/background';

interface UseBackgroundGenerationOptions {
  tenantId: string;
  onSuccess?: (background: Background) => void;
  onError?: (error: Error) => void;
}

export function useBackgroundGeneration({
  tenantId,
  onSuccess,
  onError,
}: UseBackgroundGenerationOptions) {
  const queryClient = useQueryClient();
  const [generatingBackgroundId, setGeneratingBackgroundId] = useState<string | null>(null);
  const [pollInterval, setPollInterval] = useState<number | false>(false);

  // Start generation mutation
  const generateMutation = useMutation({
    mutationFn: (request?: BackgroundGenerationRequest) =>
      backgroundsApi.generate(tenantId, request),
    onSuccess: (response) => {
      // Response contains job_id - start polling for status
      if (response.job_id) {
        setGeneratingBackgroundId(response.job_id);
        setPollInterval(2000); // Poll every 2 seconds
      }
    },
    onError: (error: Error) => {
      onError?.(error);
      setGeneratingBackgroundId(null);
      setPollInterval(false);
    },
  });

  // Poll generation status
  const statusQuery = useQuery({
    queryKey: ['background-status', generatingBackgroundId],
    queryFn: () => backgroundsApi.getStatus(generatingBackgroundId!),
    enabled: !!generatingBackgroundId,
    refetchInterval: pollInterval,
  });

  // Handle status updates
  useEffect(() => {
    if (!statusQuery.data) return;

    const { status, background, error } = statusQuery.data;

    if (status === 'completed' && background) {
      // Success! Stop polling and refresh backgrounds list
      setPollInterval(false);
      setGeneratingBackgroundId(null);
      queryClient.invalidateQueries({ queryKey: ['backgrounds', tenantId] });
      onSuccess?.(background);
    } else if (status === 'failed') {
      // Failed - stop polling
      setPollInterval(false);
      setGeneratingBackgroundId(null);
      onError?.(new Error(error || 'Background generation failed'));
    }
    // If status === 'processing', keep polling (interval already set)
  }, [statusQuery.data, tenantId, onSuccess, onError, queryClient]);

  return {
    // Generation state
    generate: generateMutation.mutate,
    isGenerating: generateMutation.isPending || !!generatingBackgroundId,
    generationError: generateMutation.error || statusQuery.error,

    // Status polling state
    currentStatus: statusQuery.data?.status,
    progress: statusQuery.data?.progress,
    estimatedTimeRemaining: statusQuery.data?.estimated_seconds_remaining,

    // Cancel generation (stop polling)
    cancel: () => {
      setGeneratingBackgroundId(null);
      setPollInterval(false);
    },
  };
}
