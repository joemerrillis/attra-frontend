import { supabase } from '../supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export interface OnboardingGoalData {
  goal: string;
  vertical: string;
  metadata?: Record<string, any>;
}

export interface TenantPreferences {
  id: string;
  tenant_id: string;
  onboarding_goal: string | null;
  onboarding_vertical: string | null;
  onboarding_completed_at: string | null;
  first_campaign_created: boolean;
  first_campaign_id: string | null;
  checklist_completed: boolean;
  goal_metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Get tenant preferences
 */
export async function getPreferences(): Promise<TenantPreferences | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const response = await fetch(`${API_BASE_URL}/api/internal/preferences`, {
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get preferences: ${response.statusText}`);
  }

  const data = await response.json();
  return Object.keys(data).length === 0 ? null : data;
}

/**
 * Save onboarding goal
 */
export async function saveOnboardingGoal(data: OnboardingGoalData): Promise<TenantPreferences> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const response = await fetch(`${API_BASE_URL}/api/internal/preferences/onboarding-goal`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to save onboarding goal: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Mark first campaign as created
 */
export async function markFirstCampaignCreated(campaignId: string): Promise<TenantPreferences> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const response = await fetch(`${API_BASE_URL}/api/internal/preferences/first-campaign`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ campaignId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to mark first campaign: ${response.statusText}`);
  }

  return response.json();
}
