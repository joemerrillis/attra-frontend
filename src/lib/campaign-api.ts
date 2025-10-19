import { supabase } from './supabase';

type CampaignsResponse = any;
type CreateCampaignRequest = any;
type CampaignResponse = any;

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // Get access token from Supabase session
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const campaignApi = {
  async list(): Promise<CampaignsResponse> {
    return fetchWithAuth('/api/internal/campaigns');
  },

  async create(data: CreateCampaignRequest): Promise<CampaignResponse> {
    return fetchWithAuth('/api/internal/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getById(id: string): Promise<CampaignResponse> {
    return fetchWithAuth(`/api/internal/campaigns/${id}`);
  },

  async update(id: string, data: Partial<CreateCampaignRequest>): Promise<CampaignResponse> {
    return fetchWithAuth(`/api/internal/campaigns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<void> {
    return fetchWithAuth(`/api/internal/campaigns/${id}`, {
      method: 'DELETE',
    });
  },

  async getStats(id: string) {
    return fetchWithAuth(`/api/internal/campaigns/${id}/stats`);
  },
};
