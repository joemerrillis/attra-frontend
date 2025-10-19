import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // Get the session from the URL
      const { data, error } = await supabase.auth.getSession();

      if (error) throw error;
      if (!data.session) {
        throw new Error('No session found');
      }

      const userId = data.session.user.id;
      const userEmail = data.session.user.email!;
      const userName = data.session.user.user_metadata?.full_name || userEmail.split('@')[0];
      const avatarUrl = data.session.user.user_metadata?.avatar_url;

      // Check if user profile exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (!existingUser) {
        // Create user profile
        const { error: userError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: userEmail,
            full_name: userName,
            avatar_url: avatarUrl,
          } as any);

        if (userError) throw userError;
      }

      // Check if user has a tenant
      const { data: userTenant } = await supabase
        .from('user_tenants')
        .select('tenant_id')
        .eq('user_id', userId)
        .single();

      if (!userTenant) {
        // New user - redirect to onboarding
        navigate('/onboarding');
      } else {
        // Existing user - redirect to dashboard
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Auth callback error:', err);
      setError('Failed to complete sign in. Please try again.');
      setTimeout(() => navigate('/login'), 3000);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}
