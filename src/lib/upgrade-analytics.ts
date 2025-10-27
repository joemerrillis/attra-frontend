/**
 * Upgrade Analytics Tracking
 *
 * Simple analytics tracking for upgrade-related events.
 * In production, this would integrate with your analytics provider (e.g., Mixpanel, Segment, etc.)
 */

export type UpgradeEventName =
  | 'upgrade_prompt_viewed'
  | 'upgrade_prompt_clicked'
  | 'upgrade_page_visited'
  | 'feature_gate_encountered'
  | 'upgrade_banner_dismissed';

export interface UpgradeEventData {
  featureKey?: string;
  source?: string; // Where the prompt was shown (e.g., 'map', 'dashboard', 'settings')
  requiredPlan?: string;
  currentPlan?: string;
}

/**
 * Track an upgrade-related event
 */
export function trackUpgradeEvent(
  eventName: UpgradeEventName,
  data?: UpgradeEventData
): void {
  // In development, log to console
  if (import.meta.env.DEV) {
    console.log('[Analytics]', eventName, data);
  }

  // In production, send to analytics provider
  // Example integrations:
  // - window.mixpanel?.track(eventName, data)
  // - window.analytics?.track(eventName, data) // Segment
  // - window.gtag?.('event', eventName, data) // Google Analytics

  // For now, we'll store in sessionStorage for debugging
  try {
    const events = JSON.parse(sessionStorage.getItem('upgrade_events') || '[]');
    events.push({
      event: eventName,
      data,
      timestamp: new Date().toISOString(),
    });
    sessionStorage.setItem('upgrade_events', JSON.stringify(events));
  } catch (error) {
    console.error('Failed to store analytics event:', error);
  }
}

/**
 * Get all tracked upgrade events (for debugging)
 */
export function getUpgradeEvents(): Array<{
  event: UpgradeEventName;
  data?: UpgradeEventData;
  timestamp: string;
}> {
  try {
    return JSON.parse(sessionStorage.getItem('upgrade_events') || '[]');
  } catch {
    return [];
  }
}

/**
 * Clear all tracked upgrade events
 */
export function clearUpgradeEvents(): void {
  try {
    sessionStorage.removeItem('upgrade_events');
  } catch (error) {
    console.error('Failed to clear analytics events:', error);
  }
}
