import { supabase } from './supabase';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // Get access token from Supabase session
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    throw new Error('Missing Authorization header');
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export interface TeamMember {
  id: string;
  tenant_id: string;
  user_id: string;
  display_name: string | null;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  permissions: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  tenants?: {
    id: string;
    name: string;
    slug: string | null;
    branding: {
      logo_url?: string;
      logo?: string;
      primaryColor?: string;
      primary_color?: string;
      secondaryColor?: string;
      secondary_color?: string;
    } | null;
    plan_key: string;
    created_at: string;
    updated_at: string;
  };
}

export const teamApi = {
  /**
   * Get all team members for the current user's tenant
   * Tenant ID is extracted from JWT
   */
  async list(): Promise<{ team_members: TeamMember[] }> {
    return fetchWithAuth('/api/internal/team');
  },
};
