import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '@/lib/api-client';

export function useQRLinks(campaignId?: string) {
  return useQuery({
    queryKey: ['qr-links', campaignId],
    queryFn: () => fetchWithAuth(`/api/internal/campaigns/${campaignId}/qr-links`),
    enabled: !!campaignId,
  });
}
