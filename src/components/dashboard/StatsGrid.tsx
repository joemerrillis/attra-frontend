import { Target, Users, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { StatCard } from './StatCard';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function StatsGrid() {
  const { data: stats, isLoading, error } = useDashboardStats();

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load dashboard stats. {error instanceof Error ? error.message : 'Please try again.'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Scans"
        value={stats?.totalScans.toLocaleString() || '0'}
        icon={Target}
        loading={isLoading}
        subtitle="All-time QR scans"
      />

      <StatCard
        title="Leads Captured"
        value={stats?.totalContacts.toLocaleString() || '0'}
        icon={Users}
        loading={isLoading}
        subtitle="Contacts in database"
      />

      <StatCard
        title="Conversion Rate"
        value={`${stats?.conversionRate || 0}%`}
        icon={TrendingUp}
        loading={isLoading}
        changeType={stats && stats.conversionRate > 15 ? 'positive' : 'neutral'}
        change={stats && stats.conversionRate > 15 ? 'Above average' : undefined}
      />

      <StatCard
        title="Avg Response Time"
        value={stats?.avgResponseTime || '—'}
        icon={Clock}
        loading={isLoading}
        subtitle="From scan to reach out"
      />
    </div>
  );
}
