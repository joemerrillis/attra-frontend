import { supabase } from './supabase';
import { backgroundsApi } from './backgrounds-api';
import { calculateRenderInstructions } from './preview-utils';
import type { GenerateAssetsRequest } from '@/types/campaign';

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

  // Handle empty responses (e.g., 204 No Content for DELETE)
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return {}; // Return empty object for non-JSON responses
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

  async generateAssets(
    campaignId: string,
    request: GenerateAssetsRequest
  ): Promise<{
    message: string;
    campaign_id: string;
    assets_created: number;
    qr_links_created: number;
    jobs_enqueued: number;
    assets: any[];
    qr_links: any[];
    job_ids: string[];
  }> {
    return fetchWithAuth(`/api/internal/campaigns/${campaignId}/generate-flyer`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /**
   * Generate campaign assets in batch with render instructions
   * Calculates exact pixel coordinates for backend PDF generation
   * Prevents race conditions by deduplicating background fetches
   */
  async generateBatch(
    campaignId: string,
    params: {
      location_ids?: string[];
      shared_copy?: { headline: string; subheadline: string; cta: string };
      shared_background_id?: string;
      shared_layout?: string;
      location_assets?: Array<{
        location_id: string;
        headline: string;
        subheadline: string;
        cta: string;
        background_id?: string;
        layout?: string;
      }>;
    }
  ): Promise<any> {
    let payload: any = { ...params };

    // SHARED MODE: Calculate render instructions once
    if (params.shared_copy && (params.shared_background_id || params.shared_layout)) {
      let background = null;

      if (params.shared_background_id) {
        background = await backgroundsApi.getById(params.shared_background_id);
      }

      payload.render_instructions = calculateRenderInstructions(
        background,
        params.shared_copy,
        params.shared_layout as any
      );
    }

    // PER-LOCATION MODE: Calculate render instructions for each
    // Deduplicate background fetches to prevent race conditions
    if (params.location_assets) {
      // Collect unique background IDs
      const uniqueBackgroundIds = [
        ...new Set(
          params.location_assets
            .map(asset => asset.background_id)
            .filter(id => id !== undefined) as string[]
        )
      ];

      // Fetch all backgrounds in parallel (deduplicated)
      const backgroundsMap = new Map();
      await Promise.all(
        uniqueBackgroundIds.map(async (bgId) => {
          const bg = await backgroundsApi.getById(bgId);
          backgroundsMap.set(bgId, bg);
        })
      );

      // Calculate render instructions for each location
      payload.location_assets_with_instructions = params.location_assets.map((asset) => {
        let background = null;

        if (asset.background_id) {
          background = backgroundsMap.get(asset.background_id) || null;
        }

        return {
          ...asset,
          render_instructions: calculateRenderInstructions(
            background,
            {
              headline: asset.headline,
              subheadline: asset.subheadline,
              cta: asset.cta
            },
            asset.layout as any
          )
        };
      });
    }

    return fetchWithAuth(`/api/internal/campaigns/${campaignId}/assets/generate-batch`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
