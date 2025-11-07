import { fetchWithAuth } from './api-client';

interface CreateAssetRequest {
  name: string;
  asset_type: string;
  campaign_id?: string;
  location_id?: string;  // NEW: Optional location for flyers, menu squares, etc.
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
  location_id: string | null;  // NEW: Optional FK to locations
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
