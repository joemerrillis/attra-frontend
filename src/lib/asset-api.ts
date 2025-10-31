import type { AssetGenerationRequest, AssetGenerationResponse } from '@/types/asset';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const assetApi = {
  async generate(
    token: string,
    data: AssetGenerationRequest
  ): Promise<AssetGenerationResponse> {
    const response = await fetch(`${API_BASE}/api/internal/assets/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to generate assets' }));
      throw new Error(error.error || 'Failed to generate assets');
    }

    return response.json();
  },

  async getStatus(token: string, assetId: string) {
    const response = await fetch(`${API_BASE}/api/internal/assets/${assetId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch asset status');
    }

    return response.json();
  },
};
