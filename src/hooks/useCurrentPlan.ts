import { useAuth } from '@/hooks/useAuth';
import type { PlanKey } from '@/types/billing';

interface UseCurrentPlanResult {
  planKey: PlanKey;
  isLoading: boolean;
}

/**
 * Get user's current plan key
 *
 * @example
 * const { planKey } = useCurrentPlan();
 * // planKey: 'free' | 'starter' | 'pro' | 'enterprise'
 */
export function useCurrentPlan(): UseCurrentPlanResult {
  const { tenant, loading } = useAuth();

  return {
    planKey: ((tenant as any)?.plan_key as PlanKey) || 'free',
    isLoading: loading,
  };
}
