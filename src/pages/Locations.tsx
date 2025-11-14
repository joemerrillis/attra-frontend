import { LocationsTab } from '@/components/settings/LocationsTab';

export default function Locations() {
  return (
    <div className="container py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          <span className="text-gray-400">&gt;●</span> Locations
        </h1>
        <p className="text-muted-foreground">
          Manage your business locations for campaign tracking
        </p>
      </div>

      {/* Reuse LocationsTab component */}
      <LocationsTab />
    </div>
  );
}