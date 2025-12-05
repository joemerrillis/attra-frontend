import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/backend';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Type exports for convenience
export type { Database };

// User type derived from auth.users metadata
export type User = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Tenant = Database['public']['Tables']['tenants']['Row'];

export type UserTenant = {
  id: string;
  user_id: string;
  tenant_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  created_at: string;
};
export type Campaign = Database['public']['Tables']['campaigns']['Row'];
export type Contact = Database['public']['Tables']['contacts']['Row'];
export type Location = Database['public']['Tables']['locations']['Row'];
