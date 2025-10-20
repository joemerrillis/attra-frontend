import type { paths } from '@/types/api';

type CreateContactRequest = paths['/api/internal/contacts']['post']['requestBody']['content']['application/json'];
type ContactResponse = paths['/api/internal/contacts']['post']['responses']['200']['content']['application/json'];

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const contactApi = {
  /**
   * Create contact (public endpoint for scan captures)
   */
  async createFromScan(data: {
    name: string;
    email: string;
    qr_link_id: string;
    campaign_id?: string;
    metadata?: Record<string, any>;
  }): Promise<ContactResponse> {
    const response = await fetch(`${API_BASE}/api/internal/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        contact_kind: 'lead',
        metadata: {
          source: 'qr_scan',
          qr_link_id: data.qr_link_id,
          campaign_id: data.campaign_id,
          ...data.metadata,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to save contact' }));
      throw new Error(error.error || 'Failed to save contact');
    }

    return response.json();
  },

  /**
   * List contacts (requires auth)
   */
  async list(token: string) {
    const response = await fetch(`${API_BASE}/api/internal/contacts`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch contacts');
    }

    return response.json();
  },
};
