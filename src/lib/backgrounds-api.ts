/**
 * Backgrounds API Client
 *
 * Handles all background-related API calls:
 * - List backgrounds
 * - Generate new background
 * - Toggle favorite
 * - Delete background
 * - Check generation status
 */

import { fetchWithAuth } from './api-client';
import type {
  Background,
  BackgroundsListResponse,
  BackgroundGenerationRequest,
  BackgroundGenerationResponse,
  BackgroundStatusResponse,
} from '@/types/background';

export const backgroundsApi = {
  /**
   * List backgrounds for tenant
   */
  async list(
    tenantId: string,
    params?: {
      sort?: 'recent' | 'popular' | 'favorites';
      favorites_only?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<BackgroundsListResponse> {
    const queryParams = new URLSearchParams();

    if (params?.sort) {
      queryParams.append('sort', params.sort);
    }
    if (params?.favorites_only) {
      queryParams.append('favorites_only', 'true');
    }
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params?.offset) {
      queryParams.append('offset', params.offset.toString());
    }

    const query = queryParams.toString();
    const url = `/api/internal/tenants/${tenantId}/backgrounds${query ? `?${query}` : ''}`;

    return fetchWithAuth(url);
  },

  /**
   * Generate new background
   */
  async generate(
    tenantId: string,
    request: BackgroundGenerationRequest = {}
  ): Promise<BackgroundGenerationResponse> {
    return fetchWithAuth(`/api/internal/tenants/${tenantId}/backgrounds/generate`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /**
   * Check background generation status
   */
  async getStatus(backgroundId: string): Promise<BackgroundStatusResponse> {
    return fetchWithAuth(`/api/internal/backgrounds/${backgroundId}/status`);
  },

  /**
   * Get single background by ID
   */
  async getById(backgroundId: string): Promise<Background> {
    return fetchWithAuth(`/api/internal/backgrounds/${backgroundId}`);
  },

  /**
   * Toggle favorite status
   */
  async toggleFavorite(backgroundId: string, isFavorite: boolean): Promise<Background> {
    return fetchWithAuth(`/api/internal/backgrounds/${backgroundId}/favorite`, {
      method: 'PUT',
      body: JSON.stringify({ is_favorite: isFavorite }),
    });
  },

  /**
   * Delete background
   */
  async delete(backgroundId: string): Promise<void> {
    await fetchWithAuth(`/api/internal/backgrounds/${backgroundId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Update background zones (manual adjustment)
   */
  async updateZones(backgroundId: string, compositionMap: any): Promise<Background> {
    return fetchWithAuth(`/api/internal/backgrounds/${backgroundId}/zones`, {
      method: 'PUT',
      body: JSON.stringify({ composition_map: compositionMap }),
    });
  },
};
