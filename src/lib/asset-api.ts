import type { AssetGenerationRequest, AssetGenerationResponse } from '@/types/asset';
import { supabase } from './supabase';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    throw new Error('Not authenticated');
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
};
