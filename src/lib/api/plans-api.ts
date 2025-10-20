import { Plan, FeatureAccessCheck, PlanLimitCheck } from '@/types/billing';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

class PlansApiClient {
  /**
   * Fetch all available pricing plans
   */
  async getPlans(): Promise<Plan[]> {
    const response = await fetch(`${API_BASE}/api/plans`);

    if (!response.ok) {
      throw new Error('Failed to fetch plans');
    }

    const data = await response.json();
    return data.plans;
  }

  /**
   * Check if user has access to a specific feature
   */
  async checkFeatureAccess(
    featureKey: string,
    token: string
  ): Promise<FeatureAccessCheck> {
    const response = await fetch(
      `${API_BASE}/api/features/${featureKey}/check`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to check feature access');
    }

    return response.json();
  }

  /**
   * Get plan limit for a specific limit key
   */
  async getPlanLimit(
    limitKey: string,
    token: string
  ): Promise<PlanLimitCheck> {
    const response = await fetch(
      `${API_BASE}/api/plans/limits/${limitKey}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get plan limit');
    }

    return response.json();
  }
}

export const plansApi = new PlansApiClient();
