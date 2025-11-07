import type { AssetGenerationRequest, AssetGenerationResponse } from '@/types/asset';
import { supabase } from './supabase';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';
console.log('🌐 [asset-api] API_BASE:', API_BASE);
console.log('🌐 [asset-api] Environment:', import.meta.env.MODE);

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  console.log('🔐 [fetchWithAuth] Starting auth check for:', url);

  // Get session with error handling
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  // Log session status
  if (sessionError) {
    console.error('❌ [fetchWithAuth] Session error:', sessionError);
    throw new Error(`Authentication error: ${sessionError.message}`);
  }

  if (!session) {
    console.error('❌ [fetchWithAuth] No session found');
    console.log('📊 [fetchWithAuth] Supabase auth state:', await supabase.auth.getUser());
    throw new Error('No active session. Please refresh the page and log in again.');
  }

  console.log('✅ [fetchWithAuth] Session exists');
  console.log('📅 [fetchWithAuth] Session expires at:', new Date(session.expires_at! * 1000).toISOString());

  const token = session.access_token;

  if (!token) {
    console.error('❌ [fetchWithAuth] Session exists but no access token');
    console.log('📊 [fetchWithAuth] Session object keys:', Object.keys(session));
    throw new Error('Session has no access token. Please log in again.');
  }

  // Log token preview (first 20 chars for security)
  console.log('🔑 [fetchWithAuth] Token exists:', token.substring(0, 20) + '...');
  console.log('📏 [fetchWithAuth] Token length:', token.length);

  // Build request with guaranteed header ordering
  const requestHeaders = {
    ...options.headers,  // User headers first (can be overridden)
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,  // Always last (guarantees presence)
  };

  console.log('📤 [fetchWithAuth] Request headers:', Object.keys(requestHeaders));
  console.log('🔐 [fetchWithAuth] Auth header present:', 'Authorization' in requestHeaders);

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: requestHeaders,
  });

  console.log('📥 [fetchWithAuth] Response status:', response.status);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    console.error('❌ [fetchWithAuth] Request failed:', error);
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  console.log('✅ [fetchWithAuth] Request successful');

  // Handle 204 No Content - no response body
  if (response.status === 204) {
    console.log('📭 [fetchWithAuth] 204 No Content - returning null');
    return null;
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
