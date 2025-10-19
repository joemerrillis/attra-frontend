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

      // Check if user has an active team member record (which means they have a tenant)
      const { data: teamMember, error: teamError } = await supabase
        .from('team_members')
        .select('id, tenant_id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (teamError || !teamMember) {
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
