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

export const themeVocabularyApi = {
  /**
   * Get all themes for tenant
   */
  async getAll(tenantId: string) {
    return fetchWithAuth(`/api/internal/tenants/${tenantId}/theme-vocabulary`);
  },

  /**
   * Get single theme by name (case-insensitive)
   */
  async getTheme(tenantId: string, themeName: string) {
    const data = await this.getAll(tenantId);
    return data.themes.find((t: any) =>
      t.theme_name.toLowerCase() === themeName.toLowerCase()
    );
  },

  /**
   * Save or update theme (upsert)
   * This is used for auto-save from asset wizard
   */
  async saveTheme(
    tenantId: string,
    themeName: string,
    keywords: string[],
    mood?: string
  ) {
    const encodedName = encodeURIComponent(themeName);
    return fetchWithAuth(
      `/api/internal/tenants/${tenantId}/theme-vocabulary/${encodedName}`,
      {
        method: 'PUT',
        body: JSON.stringify({ keywords, mood }),
      }
    );
  },

  /**
   * Delete theme
   */
  async deleteTheme(tenantId: string, themeName: string) {
    const encodedName = encodeURIComponent(themeName);
    return fetchWithAuth(
      `/api/internal/tenants/${tenantId}/theme-vocabulary/${encodedName}`,
      { method: 'DELETE' }
    );
  },
};
