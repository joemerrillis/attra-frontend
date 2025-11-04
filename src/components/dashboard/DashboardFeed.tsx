import { useDashboardSummary } from '@/hooks/useDashboardSummary';
import { ContextCard } from './ContextCard';
import { Target, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardFeed() {
  const { data: stats, isLoading, error } = useDashboardSummary();

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <ContextCard
        priority="neutral"
        icon={<AlertCircle className="w-5 h-5" />}
        headline="Unable to load dashboard"
        subtext="Check your connection and try again"
        buttonLabel="Retry"
        onButtonClick={() => window.location.reload()}
      />
    );
  }

  if (!stats) return null;

  // Simplified state-driven logic (message-theme based architecture)
  // Priority order: scans today > no assets yet > all good

  // POSITIVE: Scans happening today
  if (stats.todayScans > 0) {
    return (
      <div className="space-y-4">
        <ContextCard
          priority="positive"
          icon={<TrendingUp className="w-5 h-5" />}
          headline={`●> ${stats.todayScans} scan${stats.todayScans > 1 ? 's' : ''} today!`}
          subtext="Your QR codes are getting attention. Great job!"
        />
      </div>
    );
  }

  // ONBOARDING: No assets yet
  if (stats.assetCount === 0) {
    return (
      <ContextCard
        priority="onboarding"
        icon={<Target className="w-5 h-5" />}
        headline=">● Generate your first flyer"
        subtext="Create a flyer with a QR code to start tracking scans and engaging customers."
        buttonLabel="Create Flyer"
        buttonHref="/assets/generate"
      />
    );
  }

  // ONBOARDING: Has assets but no scans
  if (stats.assetCount > 0 && stats.todayScans === 0) {
    return (
      <ContextCard
        priority="onboarding"
        icon={<Target className="w-5 h-5" />}
        headline=">● Print and distribute your flyers"
        subtext={`You have ${stats.assetCount} flyer${stats.assetCount > 1 ? 's' : ''} ready. Hang them in high-traffic areas to start seeing scans.`}
        buttonLabel="View Assets"
        buttonHref="/assets"
      />
    );
  }

  // SUCCESS: All caught up!
  return (
    <div className="space-y-4">
      <ContextCard
        priority="success"
        icon={<CheckCircle className="w-5 h-5" />}
        headline="You're all set!"
        subtext="Your flyers are ready. Check back for scan activity."
      />

      {/* Show summary stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Assets" value={stats.assetCount} />
        <StatCard label="Today's Scans" value={stats.todayScans} />
      </div>
    </div>
  );
}

// Simple stat card for "all caught up" state
function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
