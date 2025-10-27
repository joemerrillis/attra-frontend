import { DashboardFeed } from '@/components/dashboard/DashboardFeed';
import { MapView } from '@/components/dashboard/MapView';
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed';
import { Button } from '@/components/ui/button';
import { FloatingActionButton } from '@/components/ui/floating-action-button';
import { Plus, Sparkles, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCurrentPlan } from '@/hooks/useCurrentPlan';
import { useUpgradeAnalytics } from '@/hooks/useUpgradeAnalytics';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { planKey } = useCurrentPlan();
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(true);
  const { trackPromptViewed, trackPromptClicked, trackBannerDismissed } = useUpgradeAnalytics('dashboard');

  const isFreePlan = planKey === 'free';

  // Track when upgrade banner is viewed
  useEffect(() => {
    if (isFreePlan && showUpgradeBanner) {
      trackPromptViewed();
    }
  }, [isFreePlan, showUpgradeBanner, trackPromptViewed]);

  return (
    <div className="container py-8 space-y-6 pb-24 md:pb-8">
      {/* Upgrade Banner for Free Users */}
      {isFreePlan && showUpgradeBanner && (
        <div className="relative rounded-lg border border-primary/50 bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 p-4">
          <button
            onClick={() => {
              trackBannerDismissed();
              setShowUpgradeBanner(false);
            }}
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-4 pr-8">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">
                Unlock Premium Features
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Get real-time maps, contact details, bulk campaigns, and more - starting at $29/month
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                trackPromptClicked();
                navigate('/upgrade');
              }}
              className="hidden sm:inline-flex"
            >
              View Plans
            </Button>
          </div>
          <Button
            size="sm"
            onClick={() => {
              trackPromptClicked();
              navigate('/upgrade');
            }}
            className="w-full mt-3 sm:hidden"
          >
            View Plans
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Your real-time marketing overview
          </p>
        </div>

        {/* Desktop CTA - hidden on mobile */}
        <Button
          variant="accent"
          onClick={() => navigate('/campaigns/new')}
          className="hidden md:inline-flex"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {/* Contextual Dashboard Feed */}
      <DashboardFeed />

      {/* Desktop Layout: Option C (Map left, Activity right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map - Takes 2 columns on desktop */}
        <div className="lg:col-span-2">
          <MapView />
        </div>

        {/* Activity Feed - 1 column on desktop, full width on mobile */}
        <div className="lg:col-span-1">
          <RecentActivityFeed />
        </div>
      </div>

      {/* Mobile FAB */}
      <FloatingActionButton
        to="/campaigns/new"
        label="Create Campaign"
      />
    </div>
  );
}
