import { supabase } from './supabase';

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

interface CreateAssetRequest {
  name: string;
  asset_type: string;
  campaign_id?: string;
  metadata?: {
    layout?: string;
    headline?: string;
    subheadline?: string;
    cta?: string;
    branding?: any;
  };
}

interface Asset {
  id: string;
  name: string;
  asset_type: string;
  campaign_id: string | null;
  file_url: string | null;
  file_size: number | null;
  file_type: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
}

interface GenerateFlyerRequest {
  assetId: string;
  locationId: string;
  layout?: 'classic' | 'modern' | 'minimal';
}

export const pdfApi = {
  /**
   * Create an asset record (required before generating PDF)
   */
  async createAsset(data: CreateAssetRequest): Promise<{ asset: Asset }> {
    return fetchWithAuth('/api/internal/assets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Generate PDF flyer from asset (queues background job)
   */
  async generateFlyer(campaignId: string, data: GenerateFlyerRequest): Promise<any> {
    return fetchWithAuth(`/api/internal/campaigns/${campaignId}/generate-flyer`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get all assets for a campaign
   */
  async getAssets(campaignId: string): Promise<{ assets: Asset[] }> {
    return fetchWithAuth(`/api/internal/campaigns/${campaignId}/assets`);
  },

  /**
   * Get asset status (check if PDF generation is complete)
   */
  async getAssetStatus(assetId: string): Promise<any> {
    return fetchWithAuth(`/api/internal/assets/${assetId}/status`);
  },
};
