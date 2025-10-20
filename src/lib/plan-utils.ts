import type { PlanKey, Plan } from '@/types/billing';

/**
 * Plan hierarchy for comparison
 */
const PLAN_HIERARCHY: Record<PlanKey, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  enterprise: 3,
};

/**
 * Compare two plans by tier level
 */
export function comparePlans(plan1: PlanKey, plan2: PlanKey): number {
  return PLAN_HIERARCHY[plan1] - PLAN_HIERARCHY[plan2];
}

/**
 * Check if user plan can access a required plan's features
 */
export function canAccessFeature(
  userPlan: PlanKey,
  requiredPlan: PlanKey
): boolean {
  return PLAN_HIERARCHY[userPlan] >= PLAN_HIERARCHY[requiredPlan];
}

/**
 * Format price in cents to currency string
 */
export function formatPrice(
  cents: number,
  currency: string = 'USD'
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

/**
 * Get consistent color class for plan badges
 */
export function getPlanColor(planKey: PlanKey): string {
  const colors: Record<PlanKey, string> = {
    free: 'text-gray-600 bg-gray-100',
    starter: 'text-blue-600 bg-blue-100',
    pro: 'text-purple-600 bg-purple-100',
    enterprise: 'text-orange-600 bg-orange-100',
  };
  return colors[planKey] || colors.free;
}

/**
 * Get plan display name with proper casing
 */
export function getPlanDisplayName(planKey: PlanKey): string {
  return planKey.charAt(0).toUpperCase() + planKey.slice(1);
}

/**
 * Calculate usage percentage and status
 */
export function calculateUsageStatus(
  current: number,
  limit: number | null
): {
  percentage: number;
  isWarning: boolean;
  isExceeded: boolean;
  isUnlimited: boolean;
} {
  if (limit === null) {
    return {
      percentage: 0,
      isWarning: false,
      isExceeded: false,
      isUnlimited: true,
    };
  }

  const percentage = (current / limit) * 100;

  return {
    percentage: Math.min(percentage, 100),
    isWarning: percentage > 80,
    isExceeded: current >= limit,
    isUnlimited: false,
  };
}

/**
 * Sort plans by tier level
 */
export function sortPlansByTier(plans: Plan[]): Plan[] {
  return [...plans].sort((a, b) => a.tierLevel - b.tierLevel);
}
