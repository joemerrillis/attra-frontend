import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity } from 'lucide-react';
import { ActivityItem } from './ActivityItem';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/dashboard-api';

export function RecentActivityFeed() {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: dashboardApi.getActivity,
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
