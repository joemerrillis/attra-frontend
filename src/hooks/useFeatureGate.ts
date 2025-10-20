import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { plansApi } from '@/lib/api/plans-api';
import type { PlanKey } from '@/types/billing';

interface UseFeatureGateResult {
  hasAccess: boolean;
  isLoading: boolean;
  requiredPlan?: PlanKey;
  userPlan?: PlanKey;
  upgradeUrl?: string;
  feature?: {
    key: string;
    name: string;
    description: string;
  };
}

/**
 * Check if user has access to a specific feature
 *
 * @example
 * const { hasAccess, upgradeUrl } = useFeatureGate('map_view');
 * if (!hasAccess) return <UpgradePrompt upgradeUrl={upgradeUrl} />;
 */
export function useFeatureGate(featureKey: string): UseFeatureGateResult {
  const { session, tenant } = useAuth();

  const query = useQuery({
    queryKey: ['feature-access', featureKey, tenant?.id],
    queryFn: async () => {
      if (!session) throw new Error('Not authenticated');
      return plansApi.checkFeatureAccess(featureKey, session.access_token);
    },
    enabled: !!session && !!tenant?.id,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 1,
  });

  return {
    hasAccess: query.data?.hasAccess ?? false,
    isLoading: query.isLoading,
    requiredPlan: query.data?.requiredPlan,
    userPlan: query.data?.userPlan,
    upgradeUrl: query.data?.upgradeUrl ?? undefined,
    feature: query.data?.feature,
  };
}
