import { useQuery } from '@tanstack/react-query';
import { scanApi } from '@/lib/scan-api';

export function useQRLinkData(qrId: string) {
  return useQuery({
    queryKey: ['qr-link', qrId],
    queryFn: () => scanApi.getQRLink(qrId),
    enabled: !!qrId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
}
