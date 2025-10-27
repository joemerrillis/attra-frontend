import { useDashboardSummary } from '@/hooks/useDashboardSummary';
import { ContextCard } from './ContextCard';
import { Target, TrendingUp, Mail, CheckCircle, AlertCircle } from 'lucide-react';
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

  // State-driven logic: Show most urgent card first
  // Priority order: contacts ready > scans today > no campaigns > all caught up

  // URGENT: Contacts waiting for follow-up
  if (stats.contactsReady > 0) {
    return (
      <div className="space-y-4">
        <ContextCard
          priority="urgent"
          icon={<Mail className="w-5 h-5" />}
          headline={`●> ${stats.contactsReady} contact${stats.contactsReady > 1 ? 's' : ''} ready to follow up`}
          subtext="Don't let leads go cold. Reach out now while they're interested."
          buttonLabel="View Contacts"
          buttonHref="/contacts?filter=ready"
        />

        {/* Secondary card: Today's activity */}
        {stats.todayScans > 0 && (
          <ContextCard
            priority="positive"
            icon={<TrendingUp className="w-5 h-5" />}
            headline={`●> ${stats.todayScans} scan${stats.todayScans > 1 ? 's' : ''} today`}
            subtext={stats.scansByLocation.length > 0
              ? `Most active: ${stats.scansByLocation[0].name} (${stats.scansByLocation[0].count})`
              : 'Great activity so far!'}
          />
        )}
      </div>
    );
  }

  // POSITIVE: Scans happening but no contacts yet
  if (stats.todayScans > 0 && stats.contactsReady === 0) {
    return (
      <div className="space-y-4">
        <ContextCard
          priority="positive"
          icon={<TrendingUp className="w-5 h-5" />}
          headline={`●> ${stats.todayScans} scan${stats.todayScans > 1 ? 's' : ''} today!`}
          subtext={stats.scansByLocation.length > 0
            ? `Top location: ${stats.scansByLocation[0].name} with ${stats.scansByLocation[0].count} scans`
            : 'Great activity! Keep it up.'}
          buttonLabel="View Analytics"
          buttonHref="/analytics"
        />

        {stats.emailsSentToday > 0 && (
          <ContextCard
            priority="success"
            icon={<CheckCircle className="w-5 h-5" />}
            headline={`You sent ${stats.emailsSentToday} email${stats.emailsSentToday > 1 ? 's' : ''} today`}
            subtext="Nice work staying on top of leads!"
          />
        )}
      </div>
    );
  }

  // ONBOARDING: No campaigns yet
  if (stats.campaignCount === 0) {
    return (
      <ContextCard
        priority="onboarding"
        icon={<Target className="w-5 h-5" />}
        headline=">● Create your first campaign"
        subtext="Set up a campaign to start tracking QR code scans and generating leads."
        buttonLabel="Create Campaign"
        buttonHref="/campaigns/new"
      />
    );
  }

  // ONBOARDING: Has campaigns but no scans
  if (stats.campaignCount > 0 && stats.todayScans === 0 && stats.assetCount > 0) {
    return (
      <ContextCard
        priority="onboarding"
        icon={<Target className="w-5 h-5" />}
        headline=">● Print and distribute your flyers"
        subtext={`You have ${stats.assetCount} asset${stats.assetCount > 1 ? 's' : ''} ready. Hang them in high-traffic areas to start seeing scans.`}
        buttonLabel="View Assets"
        buttonHref="/campaigns"
      />
    );
  }

  // SUCCESS: All caught up!
  return (
    <div className="space-y-4">
      <ContextCard
        priority="success"
        icon={<CheckCircle className="w-5 h-5" />}
        headline="You're all caught up!"
        subtext="No pending contacts to follow up with. Great work."
      />

      {/* Show summary stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Campaigns" value={stats.campaignCount} />
        <StatCard label="Assets" value={stats.assetCount} />
        <StatCard label="Today's Scans" value={stats.todayScans} />
        <StatCard label="Emails Sent" value={stats.emailsSentToday} />
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
