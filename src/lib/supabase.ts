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
export type User = Database['public']['Tables']['users']['Row'];
export type Tenant = Database['public']['Tables']['tenants']['Row'];
export type Campaign = Database['public']['Tables']['campaigns']['Row'];
export type Contact = Database['public']['Tables']['contacts']['Row'];
export type Location = Database['public']['Tables']['locations']['Row'];
