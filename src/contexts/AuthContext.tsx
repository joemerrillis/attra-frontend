import React, { createContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase, User, Tenant } from '@/lib/supabase';
import { tenantApi } from '@/lib/tenant-api';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  tenant: Tenant | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        loadUserAndTenant();
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        loadUserAndTenant();
      } else {
        setUser(null);
        setTenant(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserAndTenant = async () => {
    try {
      // Get authenticated user from Supabase Auth
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError || !authUser) {
        throw new Error('Failed to get authenticated user');
      }

      // Check JWT metadata for tenant_id (backend sets this in app_metadata when creating tenant)
      const tenantId = authUser.app_metadata?.tenant_id;

      if (!tenantId) {
        // User authenticated but has no tenant - needs onboarding
        console.log('User has no tenant, needs onboarding');
        setUser({
          id: authUser.id,
          email: authUser.email!,
          full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || '',
          avatar_url: authUser.user_metadata?.avatar_url || null,
          created_at: authUser.created_at,
          updated_at: new Date().toISOString(),
        });
        setTenant(null);
        setLoading(false);
        return;
      }

      // User has tenant_id - fetch full tenant data
      try {
        const tenantData = await tenantApi.getById(tenantId);

        if (!tenantData) {
          throw new Error('Tenant not found');
        }

        // Fetch user profile (if we had a users table, but here we just use what we have or generic profile)
        // Since we don't have team_members anymore, we just set the user from auth data
        // and add fields if needed.
        setUser({
          id: authUser.id,
          email: authUser.email!,
          // Fallback to metadata
          full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || '',
          avatar_url: authUser.user_metadata?.avatar_url || null,
          created_at: authUser.created_at,
          updated_at: new Date().toISOString(),
        });
        setTenant(tenantData);

      } catch (fetchError) {
        // Fetch failed, but user has tenant_id in JWT - create minimal tenant
        console.warn('Could not load full tenant data, using minimal tenant object:', fetchError);
        setUser({
          id: authUser.id,
          email: authUser.email!,
          full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || '',
          avatar_url: authUser.user_metadata?.avatar_url || null,
          created_at: authUser.created_at,
          updated_at: new Date().toISOString(),
        });
        // Create minimal tenant object - user can still access the app
        // Ensure strictly matching Tenant type (slug is string, vertical_key is string|null)
        setTenant({
          id: tenantId,
          name: 'Loading...',
          slug: '', // changed from null to empty string
          branding: null,
          // plan_key is not in Tenant type definition in backend.d.ts?
          // Let's check backend.d.ts tenants Row.
          // It has: branding, created_at, id, name, slug, updated_at, vertical_key.
          // It DOES NOT have plan_key.
          // So I should remove plan_key from this minimal object.
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          vertical_key: null,
        } as Tenant); // Cast to Tenant to satisfy potentially missing optional fields if any, or strict check
      }

    } catch (error) {
      console.error('Error loading user data:', error);
      setUser(null);
      setTenant(null);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    if (session) {
      await loadUserAndTenant();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        tenant,
        loading,
        signInWithGoogle,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};



