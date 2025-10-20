import type { paths } from '@/types/api';

type QRLinkResponse = paths['/api/internal/qr-links/{id}']['get']['responses']['200']['content']['application/json'];

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const scanApi = {
  /**
   * Get QR link details (public, no auth required)
   */
  async getQRLink(qrId: string): Promise<QRLinkResponse> {
    const response = await fetch(`${API_BASE}/api/internal/qr-links/${qrId}`);

    if (!response.ok) {
      throw new Error('QR code not found');
    }

    return response.json();
  },

  /**
   * Log scan event (public, no auth required)
   */
  async logScan(qrId: string, metadata: {
    user_agent?: string;
    referrer?: string;
    ip_address?: string;
  }): Promise<void> {
    await fetch(`${API_BASE}/q/${qrId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    });
  },

  /**
   * Get QR link analytics (requires auth)
   */
  async getAnalytics(qrId: string, token: string) {
    const response = await fetch(`${API_BASE}/api/internal/qr-links/${qrId}/analytics`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch analytics');
    }

    return response.json();
  },
};
