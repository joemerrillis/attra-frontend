import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useFeatureGate } from '@/hooks/useFeatureGate';
import { UpgradePrompt } from './UpgradePrompt';

interface LockedFeatureProps {
  featureKey: string;
  children: ReactNode;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
  showPrompt?: boolean;
}

/**
 * Wrapper component that shows children only if user has feature access
 * Shows upgrade prompt by default when locked
 *
 * @example
 * <LockedFeature featureKey="map_view">
 *   <MapComponent />
 * </LockedFeature>
 */
export function LockedFeature({
  featureKey,
  children,
  fallback,
  loadingFallback,
  showPrompt = true,
}: LockedFeatureProps) {
  const {
    hasAccess,
    isLoading,
    requiredPlan,
    upgradeUrl,
    feature,
  } = useFeatureGate(featureKey);

  // Show loading state
  if (isLoading) {
    return (
      <>
        {loadingFallback || (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </>
    );
  }

  // User has access - show children
  if (hasAccess) {
    return <>{children}</>;
  }

  // User doesn't have access - show fallback or prompt
  if (fallback) {
    return <>{fallback}</>;
  }

  if (showPrompt) {
    return (
      <UpgradePrompt
        feature={featureKey}
        featureName={feature?.name}
        featureDescription={feature?.description}
        requiredPlan={requiredPlan}
        upgradeUrl={upgradeUrl}
      />
    );
  }

  return null;
}
