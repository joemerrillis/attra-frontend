import { fetchWithAuth } from './api-client';

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
