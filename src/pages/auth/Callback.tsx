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

      // Check JWT metadata for tenant_id (backend sets this in app_metadata when creating tenant)
      const tenantId = data.session.user.app_metadata?.tenant_id;

      if (!tenantId) {
        // New user - no tenant yet, redirect to onboarding
        console.log('New user, redirecting to onboarding');
        navigate('/onboarding');
      } else {
        // Existing user with tenant - redirect to dashboard
        console.log('Existing user, redirecting to dashboard');
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