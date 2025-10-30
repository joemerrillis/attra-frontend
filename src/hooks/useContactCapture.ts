import { useMutation } from '@tanstack/react-query';
import { contactApi } from '@/lib/contact-api';

interface CaptureContactData {
  tenant_id: string;        // Required
  campaign_id?: string;
  location_id?: string;     // Optional attribution
  qr_link_id: string;
  name: string;
  email: string;
  phone?: string;           // Optional phone number
  metadata?: Record<string, any>;
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
