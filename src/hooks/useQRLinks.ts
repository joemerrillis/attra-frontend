import { useQuery } from '@tanstack/react-query';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

async function fetchWithAuth(url: string) {
  const token = localStorage.getItem('supabase.auth.token');

  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch QR links');
  }

  return response.json();
}

export function useQRLinks(campaignId?: string) {
  return useQuery({
    queryKey: ['qr-links', campaignId],
    queryFn: () => fetchWithAuth(`/api/internal/campaigns/${campaignId}/qr-links`),
    enabled: !!campaignId,
  });
}
