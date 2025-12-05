import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity } from 'lucide-react';
import { ActivityItem } from './ActivityItem';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function RecentActivityFeed() {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      // Get recent scans
      const { data: scans } = await supabase
        .from('qr_scans')
        .select(`
          id,
          scanned_at,
          location:locations(name),
          qr_link:qr_links(
            asset:assets(message_theme)
          )
        `)
        .order('scanned_at', { ascending: false })
        .limit(10);

      // Get recent contacts
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, name, created_at, location:locations(name)')
        .order('created_at', { ascending: false })
        .limit(10);

      // Combine and sort
      const combined = [
        ...(scans?.map((s: any) => ({
          type: 'scan' as const,
          title: 'QR Code Scanned',
          description: `${s.qr_link?.asset?.message_theme || 'Flyer'} at ${s.location?.name || 'Unknown'}`,
          timestamp: s.scanned_at,
        })) || []),
        ...(contacts?.map((c: any) => ({
          type: 'contact' as const,
          title: 'New Contact',
          description: `${c.name} from ${c.location?.name || 'Unknown'}`,
          timestamp: c.created_at,
        })) || []),
      ].sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ).slice(0, 15);

      return combined;
    },
    refetchInterval: 30000,
  });

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 h-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[500px] overflow-y-auto px-6">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="py-3 border-b">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-48 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))
          ) : activities && activities.length > 0 ? (
            activities.map((activity, i) => (
              <ActivityItem key={i} {...activity} />
            ))
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No activity yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
