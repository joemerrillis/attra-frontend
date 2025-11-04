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

export const backgroundApi = {
  /**
   * Generate new background
   */
  async generate(params: {
    message_theme: string;
    style_keywords: string[];
    mood_family?: string;
    generate_count?: number;
  }) {
    // Get tenant ID from user session
    const { data: { user } } = await supabase.auth.getUser();
    const tenantId = user?.app_metadata?.tenant_id || user?.user_metadata?.tenant_id;

    if (!tenantId) {
      throw new Error('Tenant ID not found in session');
    }

    return fetchWithAuth(`/api/internal/tenants/${tenantId}/backgrounds/generate`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  /**
   * Check usage (how many backgrounds generated this month)
   */
  async checkUsage() {
    // Get tenant ID from user session
    const { data: { user } } = await supabase.auth.getUser();
    const tenantId = user?.app_metadata?.tenant_id || user?.user_metadata?.tenant_id;

    if (!tenantId) {
      throw new Error('Tenant ID not found in session');
    }

    return fetchWithAuth(`/api/internal/tenants/${tenantId}/backgrounds/usage`);
  },

  /**
   * Poll job queue for background completion
   */
  async pollJobStatus(jobId: string) {
    return fetchWithAuth(`/api/internal/jobs/${jobId}`);
  },

  /**
   * Get background by ID
   */
  async getById(backgroundId: string) {
    return fetchWithAuth(`/api/internal/branding/backgrounds/${backgroundId}`);
  },
};
