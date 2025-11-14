import { fetchWithAuth } from './api-client';

interface CreateTenantRequest {
  name: string;
  slug: string;
  vertical_key?: string;
  plan_key?: 'free' | 'pro' | 'enterprise';
}

interface CreateTenantResponse {
  tenant: {
    id: string;
    name: string;
    slug: string;
    branding: any;
    created_at: string;
  };
  team_member: {
    id: string;
    role: string;
  };
}

interface UpdateBrandingRequest {
  branding: {
    logo_url?: string;
    logo?: string;
    primaryColor?: string;
    primary_color?: string;
    secondaryColor?: string;
    secondary_color?: string;
  };
}

export const tenantApi = {
  async create(data: CreateTenantRequest): Promise<CreateTenantResponse> {
    return fetchWithAuth('/api/auth/create-tenant', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getById(tenantId: string): Promise<any> {
    return fetchWithAuth(`/api/internal/tenants/${tenantId}`);
  },

  async updateBranding(tenantId: string, data: UpdateBrandingRequest): Promise<any> {
    return fetchWithAuth(`/api/internal/tenants/${tenantId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async updateBrandingContext(tenantId: string, data: { branding_ai_context: any }): Promise<any> {
    return fetchWithAuth(`/api/internal/tenants/${tenantId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};