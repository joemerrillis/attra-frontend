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

interface CreateTenantRequest {
  name: string;
  slug: string;
  vertical_key?: string;
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

  async updateBranding(tenantId: string, data: UpdateBrandingRequest): Promise<any> {
    return fetchWithAuth(`/api/internal/tenants/${tenantId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};
