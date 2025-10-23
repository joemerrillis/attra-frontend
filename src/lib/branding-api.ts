/**
 * Branding API Client
 *
 * Handles brand moment capture and premium analysis:
 * - Capture branding (free tier - Sharp-based)
 * - Premium analysis (Pro tier - Claude Vision)
 */

import { supabase } from './supabase';
import type {
  BrandingCaptureResponse,
  BrandAnalysis,
} from '@/types/background';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    throw new Error('No authentication token');
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
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

export const brandingApi = {
  /**
   * Capture branding moment (free tier)
   * Uses Sharp for color extraction and heuristic analysis
   */
  async capture(
    tenantId: string,
    data: {
      websiteUrl: string;
      instagramScreenshots?: File[];
      productImages?: File[];
    }
  ): Promise<BrandingCaptureResponse> {
    const formData = new FormData();
    formData.append('website_url', data.websiteUrl);

    // Add Instagram screenshots
    if (data.instagramScreenshots) {
      data.instagramScreenshots.forEach((file, index) => {
        formData.append(`instagram_screenshot_${index + 1}`, file);
      });
    }

    // Add product images
    if (data.productImages) {
      data.productImages.forEach((file, index) => {
        formData.append(`product_image_${index + 1}`, file);
      });
    }

    return fetchWithAuth(`/api/internal/tenants/${tenantId}/branding/capture`, {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  },

  /**
   * Premium brand analysis (Pro tier)
   * Uses Claude Vision API for deeper insights
   */
  async analyzePremium(
    tenantId: string,
    forceReanalysis: boolean = false
  ): Promise<{ analysis: BrandAnalysis; cost: number }> {
    return fetchWithAuth(`/api/internal/tenants/${tenantId}/branding/analyze-premium`, {
      method: 'POST',
      body: JSON.stringify({ force_reanalysis: forceReanalysis }),
    });
  },

  /**
   * Get branding status
   */
  async getStatus(tenantId: string): Promise<{ status: string; analysis?: BrandAnalysis }> {
    return fetchWithAuth(`/api/internal/tenants/${tenantId}/branding-status`);
  },

  /**
   * Capture branding during onboarding (before tenant exists)
   * Uses tenant_id from JWT, no tenantId parameter needed
   */
  async captureOnboarding(data: {
    websiteUrl: string;
    instagramScreenshots?: File[];
    productImages?: File[];
  }): Promise<BrandingCaptureResponse> {
    const formData = new FormData();
    formData.append('website_url', data.websiteUrl);

    // Add Instagram screenshots
    if (data.instagramScreenshots) {
      data.instagramScreenshots.forEach((file, index) => {
        formData.append(`instagram_screenshot_${index + 1}`, file);
      });
    }

    // Add product images
    if (data.productImages) {
      data.productImages.forEach((file, index) => {
        formData.append(`product_image_${index + 1}`, file);
      });
    }

    return fetchWithAuth(`/api/internal/branding/capture-onboarding`, {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  },
};
