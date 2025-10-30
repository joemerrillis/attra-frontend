const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

interface ContactResponse {
  contact: {
    id: string;
    name: string;
    email: string;
    contact_kind: string;
  };
}

export const contactApi = {
  /**
   * Create contact from QR scan (public endpoint - no auth required)
   */
  async createFromScan(data: {
    tenant_id: string;        // Required by public endpoint
    campaign_id?: string;
    location_id?: string;     // Optional attribution
    qr_link_id: string;
    name: string;
    email: string;
    phone?: string;           // Optional phone number
    metadata?: Record<string, any>;
  }): Promise<ContactResponse> {
    const response = await fetch(`${API_BASE}/api/public/leads/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tenant_id: data.tenant_id,
        campaign_id: data.campaign_id,
        location_id: data.location_id,
        qr_link_id: data.qr_link_id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        metadata: data.metadata,
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
