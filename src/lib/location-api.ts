import { fetchWithAuth } from './api-client';

interface CreateLocationRequest {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  neighborhood?: string;
  location_type?: 'business' | 'advertisement';
  geo?: {
    lat: number;
    lng: number;
  };
}

export const locationApi = {
  async list(): Promise<any> {
    return fetchWithAuth('/api/internal/locations');
  },

  async create(data: CreateLocationRequest): Promise<any> {
    return fetchWithAuth('/api/internal/locations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getById(id: string): Promise<any> {
    return fetchWithAuth(`/api/internal/locations/${id}`);
  },

  async update(id: string, data: Partial<CreateLocationRequest>): Promise<any> {
    return fetchWithAuth(`/api/internal/locations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<any> {
    return fetchWithAuth(`/api/internal/locations/${id}`, {
      method: 'DELETE',
    });
  },
};
