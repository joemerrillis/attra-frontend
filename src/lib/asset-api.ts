import type { AssetGenerationRequest, AssetGenerationResponse } from '@/types/asset';
import { fetchWithAuth } from './api-client';

export const assetApi = {
  async generate(data: AssetGenerationRequest): Promise<AssetGenerationResponse> {
    return fetchWithAuth('/api/internal/assets/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getStatus(assetId: string) {
    return fetchWithAuth(`/api/internal/assets/${assetId}`);
  },

  async list() {
    return fetchWithAuth('/api/internal/assets');
  },

  async delete(assetId: string) {
    return fetchWithAuth(`/api/internal/assets/${assetId}`, {
      method: 'DELETE',
    });
  },

  async emailToPrinter(data: { to: string; subject: string; body: string }) {
    return fetchWithAuth('/api/internal/gmail/draft', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
