import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { tenantApi } from '@/lib/tenant-api';
import { verticalApi } from '@/lib/vertical-api';
import { locationApi } from '@/lib/location-api';
import { uploadApi } from '@/lib/upload-api';
import { VERTICAL_CONFIGS } from '@/lib/vertical-configs';
import { saveOnboardingGoal } from '@/lib/api/preferences';

interface OnboardingData {
  vertical: string;
  tenantName: string;
  logoFile: File | null;
  primaryColor: string;
  location: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    latitude: number | null;
    longitude: number | null;
  };
  campaignGoal: string;
}

export const useOnboarding = () => {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completeOnboarding = async (data: OnboardingData) => {
    setLoading(true);
    setError(null);

    try {
      // STEP 1: Create tenant (creates tenant + team_member atomically)
      const slug = data.tenantName.toLowerCase().replace(/\s+/g, '-');
      const { tenant } = await tenantApi.create({
        name: data.tenantName,
        slug,
        vertical_key: data.vertical,
        plan_key: 'free',
      });

      // STEP 2: Refresh session to get updated JWT with tenant_id
      // Backend updates user_metadata.tenant_id when creating tenant
      // But the client's JWT is stale until we refresh it
      const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) throw refreshError;
      if (!session) throw new Error('Failed to refresh session');

      // STEP 3: Upload logo if provided (now JWT has tenant_id for RLS)
      if (data.logoFile) {
        await uploadApi.uploadLogo(data.logoFile);
      }

      // STEP 4: Update branding (color only - logo already updated by upload)
      if (data.primaryColor) {
        await tenantApi.updateBranding(tenant.id, {
          branding: {
            primaryColor: data.primaryColor,
            primary_color: data.primaryColor,
          },
        });
      }

      // STEP 5: Create tenant_vertical
      const verticalConfig = VERTICAL_CONFIGS[data.vertical] || VERTICAL_CONFIGS.default;
      await verticalApi.createTenantVertical({
        tenant_id: tenant.id,
        vertical_key: data.vertical,
        language_config: {
          name: verticalConfig.name,
          audience: verticalConfig.audience,
          tone: verticalConfig.tone,
        },
      });

      // STEP 6: Create first location (tenant_id extracted from JWT)
      await locationApi.create({
        name: data.location.name,
        address: data.location.address,
        city: data.location.city,
        state: data.location.state,
        zip: data.location.zipCode,
        geo: data.location.latitude && data.location.longitude
          ? {
              lat: data.location.latitude,
              lng: data.location.longitude,
            }
          : undefined,
      });

      // STEP 7: Save campaign goal to backend
      try {
        await saveOnboardingGoal({
          goal: data.campaignGoal,
          vertical: data.vertical,
          metadata: {},
        });
        console.log('[Onboarding] Campaign goal saved to backend');
      } catch (error) {
        console.error('[Onboarding] Failed to save campaign goal:', error);
        // Non-blocking - continue even if this fails
      }

      // STEP 8: Remove old localStorage approach
      localStorage.removeItem('attra_campaign_goal'); // Clean up old data

      // STEP 9: Refresh user context (now has tenant via team_members)
      await refreshUser();

      // STEP 10: Redirect to campaign creation WITH goal parameter
      navigate(`/campaigns/new?goal=${data.campaignGoal}&vertical=${data.vertical}&fromOnboarding=true`);

    } catch (err: any) {
      console.error('Onboarding error:', err);
      setError(err.message || 'Failed to complete onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return { completeOnboarding, loading, error };
};
