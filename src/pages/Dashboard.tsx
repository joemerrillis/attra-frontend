import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { MapView } from '@/components/dashboard/MapView';
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Track your attribution in real-time
          </p>
        </div>

        <Button onClick={() => navigate('/campaigns/new')}>
          <Plus className="w-4 h-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {/* Stats Grid */}
      <StatsGrid />

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
    </div>
  );
}
