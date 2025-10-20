import { Badge } from '@/components/ui/badge';
import { getPlanColor, getPlanDisplayName } from '@/lib/plan-utils';
import type { PlanKey } from '@/types/billing';

interface FeatureBadgeProps {
  planKey: PlanKey;
  size?: 'sm' | 'md';
}

/**
 * Small badge showing plan tier for features
 *
 * @example
 * <FeatureBadge planKey="pro" />
 */
export function FeatureBadge({ planKey, size = 'sm' }: FeatureBadgeProps) {
  const colorClass = getPlanColor(planKey);
  const displayName = getPlanDisplayName(planKey);

  return (
    <Badge
      variant="secondary"
      className={`${colorClass} ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
    >
      {displayName}
    </Badge>
  );
}
