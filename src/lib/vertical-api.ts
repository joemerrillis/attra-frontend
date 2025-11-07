import { fetchWithAuth } from './api-client';

interface CreateTenantVerticalRequest {
  tenant_id: string;
  vertical_key: string;
  language_config: {
    name: string;
    audience: string;
    tone: string;
  };
}

export const verticalApi = {
  async createTenantVertical(data: CreateTenantVerticalRequest): Promise<any> {
    return fetchWithAuth('/api/internal/tenant-verticals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
