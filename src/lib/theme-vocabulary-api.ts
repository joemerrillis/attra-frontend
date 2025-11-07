import { fetchWithAuth } from './api-client';

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
