import { useEffect, useCallback } from 'react';
import { trackUpgradeEvent } from '@/lib/upgrade-analytics';
import { useCurrentPlan } from './useCurrentPlan';

/**
 * Hook for tracking upgrade-related analytics events
 */
export function useUpgradeAnalytics(source: string) {
  const { planKey: currentPlan } = useCurrentPlan();

  /**
   * Track when a user views an upgrade prompt
   */
  const trackPromptViewed = useCallback(
    (featureKey?: string, requiredPlan?: string) => {
      trackUpgradeEvent('upgrade_prompt_viewed', {
        source,
        featureKey,
        requiredPlan,
        currentPlan,
      });
    },
    [source, currentPlan]
  );

  /**
   * Track when a user clicks an upgrade button/link
   */
  const trackPromptClicked = useCallback(
    (featureKey?: string, requiredPlan?: string) => {
      trackUpgradeEvent('upgrade_prompt_clicked', {
        source,
        featureKey,
        requiredPlan,
        currentPlan,
      });
    },
    [source, currentPlan]
  );

  /**
   * Track when a user encounters a feature gate (locked feature)
   */
  const trackFeatureGateEncountered = useCallback(
    (featureKey: string, requiredPlan?: string) => {
      trackUpgradeEvent('feature_gate_encountered', {
        source,
        featureKey,
        requiredPlan,
        currentPlan,
      });
    },
    [source, currentPlan]
  );

  /**
   * Track when a user dismisses an upgrade banner
   */
  const trackBannerDismissed = useCallback(
    (featureKey?: string) => {
      trackUpgradeEvent('upgrade_banner_dismissed', {
        source,
        featureKey,
        currentPlan,
      });
    },
    [source, currentPlan]
  );

  return {
    trackPromptViewed,
    trackPromptClicked,
    trackFeatureGateEncountered,
    trackBannerDismissed,
  };
}

/**
 * Hook to track when the upgrade page is visited
 */
export function useTrackUpgradePageView() {
  const { planKey: currentPlan } = useCurrentPlan();

  useEffect(() => {
    // Get feature parameter from URL
    const urlParams = new URLSearchParams(window.location.search);
    const featureKey = urlParams.get('feature');

    trackUpgradeEvent('upgrade_page_visited', {
      source: 'direct',
      featureKey: featureKey || undefined,
      currentPlan,
    });
  }, [currentPlan]);
}
