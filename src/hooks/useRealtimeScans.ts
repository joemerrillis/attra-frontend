import { useEffect, useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface RealtimeScan {
  id: string;
  location_id: string;
  location?: {
    name: string;
    coordinates: { lat: number; lng: number };
  };
  scanned_at: string;
  campaign?: { name: string };
}

export function useRealtimeScans() {
  const [recentScans, setRecentScans] = useState<RealtimeScan[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const { tenant } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!tenant?.id) return;

    // Connect to WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/realtime`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);

      // Authenticate
      ws.send(JSON.stringify({
        type: 'authenticate',
        tenant_id: tenant.id,
      }));

      // Subscribe to qr_scans
      ws.send(JSON.stringify({
        type: 'subscribe',
        table: 'qr_scans',
      }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === 'INSERT' && message.table === 'qr_scans') {
          // New scan received
          const newScan: RealtimeScan = {
            id: message.data.id,
            location_id: message.data.location_id,
            scanned_at: message.data.scanned_at,
          };

          setRecentScans(prev => [newScan, ...prev].slice(0, 50));

          // Invalidate dashboard stats to refresh
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });

          // Show toast notification (optional)
          toast({
            title: 'New scan!',
            description: 'Someone just scanned your QR code',
            duration: 3000,
          });
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    // Cleanup on unmount
    return () => {
      ws.close();
    };
  }, [tenant?.id, queryClient, toast]);

  return {
    recentScans,
    isConnected,
  };
}
