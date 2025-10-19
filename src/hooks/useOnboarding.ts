import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

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
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completeOnboarding = async (data: OnboardingData) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Upload logo if provided
      let logoUrl: string | null = null;
      if (data.logoFile) {
        const fileExt = data.logoFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('logos')
          .upload(fileName, data.logoFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('logos')
          .getPublicUrl(fileName);

        logoUrl = publicUrl;
      }

      // 2. Create tenant
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: data.tenantName,
          logo_url: logoUrl,
          primary_color: data.primaryColor,
          slug: data.tenantName.toLowerCase().replace(/\s+/g, '-'),
        } as any)
        .select()
        .single();

      if (tenantError) throw tenantError;

      // 3. Link user to tenant
      const { error: userTenantError } = await supabase
        .from('user_tenants')
        .insert({
          user_id: user.id,
          tenant_id: (tenant as any).id,
          role: 'owner',
        } as any);

      if (userTenantError) throw userTenantError;

      // 4. Set tenant vertical
      const { error: verticalError } = await supabase
        .from('tenant_verticals')
        .insert({
          tenant_id: (tenant as any).id,
          vertical_key: data.vertical,
        } as any);

      if (verticalError) throw verticalError;

      // 5. Create first location
      const { error: locationError } = await supabase
        .from('locations')
        .insert({
          tenant_id: (tenant as any).id,
          name: data.location.name,
          address: data.location.address,
          city: data.location.city,
          state: data.location.state,
          zip_code: data.location.zipCode,
          latitude: data.location.latitude,
          longitude: data.location.longitude,
        } as any);

      if (locationError) throw locationError;

      // 6. Store campaign goal in localStorage (used in next step)
      localStorage.setItem('attra_campaign_goal', data.campaignGoal);

      // 7. Refresh user context
      await refreshUser();

      // 8. Redirect to dashboard (campaign wizard will be file 04)
      navigate('/dashboard');

    } catch (err) {
      console.error('Onboarding error:', err);
      setError('Failed to complete onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return { completeOnboarding, loading, error };
};
