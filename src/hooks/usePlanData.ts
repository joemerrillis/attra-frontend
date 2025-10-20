import { useQuery } from '@tanstack/react-query';
import { plansApi } from '@/lib/api/plans-api';
import { sortPlansByTier } from '@/lib/plan-utils';
import type { Plan } from '@/types/billing';

interface UsePlanDataResult {
  plans: Plan[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Fetch all available pricing plans
 * Used for pricing pages and upgrade flows
 *
 * @example
 * const { plans, isLoading } = usePlanData();
 */
export function usePlanData(): UsePlanDataResult {
  const query = useQuery({
    queryKey: ['plans'],
    queryFn: plansApi.getPlans,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });

  return {
    plans: query.data ? sortPlansByTier(query.data) : [],
    isLoading: query.isLoading,
    error: query.error as Error | null,
  };
}
