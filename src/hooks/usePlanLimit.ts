import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { plansApi } from '@/lib/api/plans-api';

interface UsePlanLimitResult {
  limitValue: number | null;
  isUnlimited: boolean;
  isLoading: boolean;
}

/**
 * Get the limit value for a specific limit key on user's current plan
 *
 * @example
 * const { limitValue, isUnlimited } = usePlanLimit('contacts_per_month');
 * // limitValue: 1000 (or null if unlimited)
 */
export function usePlanLimit(limitKey: string): UsePlanLimitResult {
  const { session } = useAuth();

  const query = useQuery({
    queryKey: ['plan-limit', limitKey],
    queryFn: async () => {
      if (!session) throw new Error('Not authenticated');
      return plansApi.getPlanLimit(limitKey, session.access_token);
    },
    enabled: !!session,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  return {
    limitValue: query.data?.limitValue ?? null,
    isUnlimited: query.data?.isUnlimited ?? false,
    isLoading: query.isLoading,
  };
}
