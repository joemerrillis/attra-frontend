/**
 * useBrandingCapture Hook
 *
 * React Query hook for brand moment capture and premium analysis
 * - Capture brand assets (website, Instagram, product images)
 * - Request premium Claude Vision analysis
 * - Check branding status
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { brandingApi } from '@/lib/branding-api';
import type { BrandingCaptureResponse, BrandAnalysis } from '@/types/background';

interface UseBrandingCaptureOptions {
  tenantId: string;
  onCaptureSuccess?: (response: BrandingCaptureResponse) => void;
  onAnalysisSuccess?: (analysis: BrandAnalysis) => void;
  onError?: (error: Error) => void;
}

export function useBrandingCapture({
  tenantId,
  onCaptureSuccess,
  onAnalysisSuccess,
  onError,
}: UseBrandingCaptureOptions) {
  const queryClient = useQueryClient();

  // Fetch current branding status
  const statusQuery = useQuery({
    queryKey: ['branding-status', tenantId],
    queryFn: () => brandingApi.getStatus(tenantId),
    enabled: !!tenantId,
  });

  // Capture branding mutation (free tier)
  const captureMutation = useMutation({
    mutationFn: (data: {
      websiteUrl: string;
      instagramScreenshots?: File[];
      productImages?: File[];
    }) => brandingApi.capture(tenantId, data),
    onSuccess: (response) => {
      // Invalidate status query to refresh
      queryClient.invalidateQueries({ queryKey: ['branding-status', tenantId] });
      onCaptureSuccess?.(response);
    },
    onError,
  });

  // Premium analysis mutation (Pro tier)
  const analyzePremiumMutation = useMutation({
    mutationFn: (forceReanalysis: boolean = false) =>
      brandingApi.analyzePremium(tenantId, forceReanalysis),
    onSuccess: (response) => {
      // Invalidate status query to refresh
      queryClient.invalidateQueries({ queryKey: ['branding-status', tenantId] });
      onAnalysisSuccess?.(response.analysis);
    },
    onError,
  });

  return {
    // Status query
    status: statusQuery.data?.status,
    analysis: statusQuery.data?.analysis,
    isLoadingStatus: statusQuery.isLoading,
    hasBasicCapture: statusQuery.data?.status === 'captured' || statusQuery.data?.status === 'analyzed',
    hasPremiumAnalysis: statusQuery.data?.status === 'analyzed',

    // Capture mutation (free tier)
    capture: captureMutation.mutate,
    isCapturing: captureMutation.isPending,
    captureError: captureMutation.error,

    // Premium analysis mutation (Pro tier)
    analyzePremium: analyzePremiumMutation.mutate,
    isAnalyzing: analyzePremiumMutation.isPending,
    analysisError: analyzePremiumMutation.error,

    // Utilities
    refetchStatus: statusQuery.refetch,
  };
}
