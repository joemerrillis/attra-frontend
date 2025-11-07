import { fetchWithAuth } from './api-client';

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
