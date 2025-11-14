import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { MapView } from '@/components/dashboard/MapView';

export default function Analytics() {
  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          <span className="text-gray-400">&gt;●</span> Analytics
        </h1>
        <p className="text-muted-foreground">
          Deep dive into your attribution data
        </p>
      </div>

      {/* Stats Grid */}
      <StatsGrid />

      {/* Map - Full Width */}
      <MapView />
    </div>
  );
}