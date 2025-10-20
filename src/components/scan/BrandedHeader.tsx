import { Building2 } from 'lucide-react';

interface BrandedHeaderProps {
  tenantName: string;
  tenantLogo?: string;
  campaignHeadline?: string;
  campaignSubheadline?: string;
}

export function BrandedHeader({
  tenantName,
  tenantLogo,
  campaignHeadline,
  campaignSubheadline,
}: BrandedHeaderProps) {
  return (
    <div className="text-center mb-8">
      {/* ●> Symbol - Physical to Digital */}
      <div className="mb-4">
        <span className="text-5xl text-blue-600 font-bold">●></span>
      </div>

      {/* Tenant Logo */}
      {tenantLogo ? (
        <img
          src={tenantLogo}
          alt={tenantName}
          className="h-16 mx-auto mb-4"
        />
      ) : (
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-lg mb-4">
          <Building2 className="w-8 h-8 text-gray-400" />
        </div>
      )}

      {/* Campaign Headline */}
      {campaignHeadline && (
        <h1 className="text-3xl font-bold mb-2 text-gray-900">
          {campaignHeadline}
        </h1>
      )}

      {/* Campaign Subheadline */}
      {campaignSubheadline && (
        <p className="text-lg text-gray-600 mb-4 max-w-md mx-auto">
          {campaignSubheadline}
        </p>
      )}

      {/* Friendly Message */}
      <p className="text-sm text-gray-500">
        You scanned our flyer. Let's connect!
      </p>
    </div>
  );
}
