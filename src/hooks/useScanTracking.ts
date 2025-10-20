import { useEffect, useRef } from 'react';
import { scanApi } from '@/lib/scan-api';

export function useScanTracking(qrId: string) {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!qrId || hasTracked.current) return;

    // Simply redirect to the QR URL - backend will log the scan automatically
    // The backend's GET /q/:id endpoint logs the scan and redirects
    try {
      scanApi.logScan(qrId);
      hasTracked.current = true;
    } catch (error) {
      console.error('Failed to redirect to QR URL:', error);
    }
  }, [qrId]);

  return { isTracked: hasTracked.current };
}
