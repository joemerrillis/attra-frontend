import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface FeatureAccessResponse {
  hasAccess: boolean;
  userPlan: 'free' | 'starter' | 'pro' | 'enterprise';
  requiredPlan: 'free' | 'starter' | 'pro' | 'enterprise';
  upgradeUrl: string;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export function useFeatureAccess(featureKey: string) {
  return useQuery({
    queryKey: ['features', featureKey, 'check'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(
        `${API_BASE}/api/features/${featureKey}/check`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to check feature access');
      }

      return response.json() as Promise<FeatureAccessResponse>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes (plan doesn't change often)
  });
}
