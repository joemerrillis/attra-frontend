import { useMutation } from '@tanstack/react-query';
import { contactApi } from '@/lib/contact-api';

interface CaptureContactData {
  name: string;
  email: string;
  qr_link_id: string;
  campaign_id?: string;
}

export function useContactCapture() {
  const mutation = useMutation({
    mutationFn: (data: CaptureContactData) => contactApi.createFromScan(data),
  });

  return {
    capture: mutation.mutate,
    isCapturing: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
  };
}
