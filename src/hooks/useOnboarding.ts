import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { tenantApi } from '@/lib/tenant-api';
import { verticalApi } from '@/lib/vertical-api';
import { locationApi } from '@/lib/location-api';
import { VERTICAL_CONFIGS } from '@/lib/vertical-configs';

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
      });

      // STEP 2: Upload logo if provided (AFTER tenant exists)
      let logoUrl: string | null = null;
      if (data.logoFile) {
        const fileExt = data.logoFile.name.split('.').pop();
        const fileName = `${tenant.id}/logo.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('logos')
          .upload(fileName, data.logoFile, {
            upsert: true,
            contentType: data.logoFile.type,
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('logos')
          .getPublicUrl(fileName);

        logoUrl = publicUrl;

        // STEP 3: Update tenant branding
        await tenantApi.updateBranding(tenant.id, {
          branding: {
            logo_url: logoUrl,
            logo: logoUrl, // PDF worker compatibility
            primaryColor: data.primaryColor || '#6366f1',
            primary_color: data.primaryColor || '#6366f1',
          },
        });
      }

      // STEP 4: Create tenant_vertical
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

      // STEP 5: Create first location (tenant_id extracted from JWT)
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

      // STEP 6: Store campaign goal in localStorage (for campaign creation)
      localStorage.setItem('attra_campaign_goal', data.campaignGoal);

      // STEP 7: Refresh user context (now has tenant via team_members)
      await refreshUser();

      // STEP 8: Redirect to campaign creation
      navigate('/campaigns/new');

    } catch (err: any) {
      console.error('Onboarding error:', err);
      setError(err.message || 'Failed to complete onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return { completeOnboarding, loading, error };
};
