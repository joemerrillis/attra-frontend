import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface WizardState {
  currentStep: number;
  name?: string;
  description?: string;
  goal?: string;
  selectedLocations?: string[];
  assetType?: string;
  customizePerLocation?: boolean;
  destinationUrl?: string;
  copy?: {
    headline: string;
    subheadline: string;
    cta: string;
  };
  layout?: string;
  background_id?: string;
  locationAssets?: Array<{
    location_id: string;
    copy: {
      headline: string;
      subheadline: string;
      cta: string;
    };
    layout?: string;
    background_id?: string;
  }>;
}

interface CampaignDraft {
  id: string;
  wizard_state: WizardState;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

export function useCampaignDraft() {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  /**
   * Get authorization token
   */
  const getToken = useCallback(async () => {
    // Get token from Supabase session
    const { default: supabase } = await import('@/lib/supabase');
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  }, []);

  /**
   * Load existing draft (call on wizard mount)
   */
  const loadDraft = useCallback(async (): Promise<WizardState | null> => {
    if (!user) return null;

    try {
      const token = await getToken();
      if (!token) return null;

      const response = await fetch(`${apiUrl}/api/internal/campaigns/draft`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 404) {
        // No draft exists - start fresh
        return null;
      }

      if (!response.ok) {
        throw new Error('Failed to load draft');
      }

      const draft: CampaignDraft = await response.json();
      return draft.wizard_state;
    } catch (err) {
      console.error('Error loading draft:', err);
      setError('Failed to load saved draft');
      return null;
    }
  }, [user, apiUrl, getToken]);

  /**
   * Save draft (manual or auto-save)
   */
  const saveDraft = useCallback(async (wizardState: WizardState): Promise<boolean> => {
    if (!user) return false;

    setIsSaving(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${apiUrl}/api/internal/campaigns/draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ wizard_state: wizardState }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save draft');
      }

      setLastSaved(new Date());
      return true;
    } catch (err) {
      console.error('Error saving draft:', err);
      setError(err instanceof Error ? err.message : 'Failed to save draft');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user, apiUrl, getToken]);

  /**
   * Delete draft (after campaign creation or "Start Fresh")
   */
  const deleteDraft = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const token = await getToken();
      if (!token) return false;

      const response = await fetch(`${apiUrl}/api/internal/campaigns/draft`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      // 204 = success, 404 = no draft to delete (also ok)
      return response.status === 204 || response.status === 404;
    } catch (err) {
      console.error('Error deleting draft:', err);
      return false;
    }
  }, [user, apiUrl, getToken]);

  return {
    loadDraft,
    saveDraft,
    deleteDraft,
    isSaving,
    lastSaved,
    error,
  };
}
