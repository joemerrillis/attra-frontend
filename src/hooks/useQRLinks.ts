import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

async function fetchWithAuth(url: string) {
  // Get access token from Supabase session (consistent with other API calls)
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    console.error('❌ No auth token available for QR links request');
    throw new Error('No authentication token available');
  }

  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ QR links request failed:', response.status, errorText);
    throw new Error(`Failed to fetch QR links: ${response.status}`);
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
