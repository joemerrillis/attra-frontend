import { useEffect, useRef } from 'react';
import { scanApi } from '@/lib/scan-api';

export function useScanTracking(qrId: string) {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!qrId || hasTracked.current) return;

    const trackScan = async () => {
      try {
        await scanApi.logScan(qrId, {
          user_agent: navigator.userAgent,
          referrer: document.referrer,
          // IP captured server-side
        });
        hasTracked.current = true;
      } catch (error) {
        console.error('Failed to track scan:', error);
      }
    };

    trackScan();
  }, [qrId]);

  return { isTracked: hasTracked.current };
}
