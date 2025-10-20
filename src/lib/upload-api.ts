import { supabase } from './supabase';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // Get access token from Supabase session
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    throw new Error('Missing Authorization header');
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

interface UploadLogoResponse {
  logo_url: string;
  message?: string;
}

export const uploadApi = {
  /**
   * Uploads a logo file to the backend.
   * Backend handles storage and updates tenant branding automatically.
   * Requires JWT with tenant_id (must be called after tenant creation + session refresh)
   */
  async uploadLogo(file: File): Promise<UploadLogoResponse> {
    const formData = new FormData();
    formData.append('logo', file);

    return fetchWithAuth('/api/internal/upload/logo', {
      method: 'POST',
      body: formData,
      // Don't set Content-Type - browser will set it with boundary for multipart/form-data
    });
  },
};
