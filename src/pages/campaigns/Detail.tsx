import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, TrendingUp, FileText, Loader2 } from 'lucide-react';
import { campaignApi } from '@/lib/campaign-api';
import { markFirstCampaignCreated } from '@/lib/api/preferences';
import { FirstCampaignCelebration } from '@/components/campaigns/FirstCampaignCelebration';

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showCelebration, setShowCelebration] = useState(false);

  const { data: campaign, isLoading, error } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => campaignApi.getById(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      // If any asset is still generating, poll every 5 seconds
      const hasGenerating = query?.state?.data?.assets?.some((asset: any) => !asset.file_url);
      return hasGenerating ? 5000 : false;
    },
  });

  // Mutation to mark first campaign created
  const { mutate: markFirstCampaign } = useMutation({
    mutationFn: () => markFirstCampaignCreated(id!),
    onSuccess: () => {
      console.log('[Celebration] First campaign marked in backend');
    },
    onError: (error) => {
      console.error('[Celebration] Failed to mark first campaign:', error);
      // Non-blocking - celebration still shows
    },
  });

  // Check if we should show celebration
  useEffect(() => {
    if (!id || !campaign) return;

    // Check localStorage for celebration flag
    const shouldCelebrate = localStorage.getItem(`celebrate_campaign_${id}`);

    if (shouldCelebrate === 'true') {
      // Show celebration
      setShowCelebration(true);

      // Mark as created in backend
      markFirstCampaign();

      // Clean up localStorage flag
      localStorage.removeItem(`celebrate_campaign_${id}`);
      console.log('[Celebration] Showing celebration modal for first campaign');
    }
  }, [campaign, id]);

  const handleCloseCelebration = () => {
    setShowCelebration(false);
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Campaign not found</h3>
            <p className="text-muted-foreground mb-4">
              This campaign doesn't exist or you don't have access to it.
            </p>
            <Button onClick={() => navigate('/campaigns')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Campaigns
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/campaigns')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold">{campaign.name}</h1>
            <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
              {campaign.status}
            </Badge>
          </div>
          {campaign.description && (
            <p className="text-muted-foreground">{campaign.description}</p>
          )}
        </div>
      </div>

      {/* Campaign Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Created
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-lg font-semibold">
                {campaign.created_at
                  ? new Date(campaign.created_at).toLocaleDateString()
                  : 'Unknown'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Scans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-lg font-semibold">
                {campaign.scans !== undefined ? campaign.scans : 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">
                {campaign.budget ? `$${campaign.budget}` : 'Not set'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Details */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
          <CardDescription>
            View and manage your campaign information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Start Date</p>
              <p className="font-medium">
                {campaign.start_date
                  ? new Date(campaign.start_date).toLocaleDateString()
                  : 'Not set'}
              </p>
            </div>

            <div>
              <p className="text-muted-foreground">End Date</p>
              <p className="font-medium">
                {campaign.end_date
                  ? new Date(campaign.end_date).toLocaleDateString()
                  : 'Not set'}
              </p>
            </div>

            <div>
              <p className="text-muted-foreground">Campaign ID</p>
              <p className="font-mono text-xs">{campaign.id}</p>
            </div>

            <div>
              <p className="text-muted-foreground">Last Updated</p>
              <p className="font-medium">
                {campaign.updated_at
                  ? new Date(campaign.updated_at).toLocaleDateString()
                  : 'Unknown'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Assets */}
      {campaign.assets && campaign.assets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Campaign Assets</CardTitle>
            <CardDescription>
              Download your generated flyers and marketing materials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {campaign.assets.map((asset: any) => (
                <div
                  key={asset.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{asset.name || 'Campaign Asset'}</p>
                    <p className="text-sm text-muted-foreground">
                      {asset.asset_type || 'flyer'} • Created {new Date(asset.created_at).toLocaleDateString()}
                    </p>
                    {!asset.file_url && (
                      <Badge variant="secondary" className="mt-2">
                        Generating...
                      </Badge>
                    )}
                    {asset.file_url && (
                      <Badge variant="default" className="mt-2">
                        Ready
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {asset.file_url ? (
                      <Button asChild>
                        <a href={asset.file_url} download target="_blank" rel="noopener noreferrer">
                          <FileText className="w-4 h-4 mr-2" />
                          Download PDF
                        </a>
                      </Button>
                    ) : (
                      <Button disabled>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Placeholder for future sections */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
          <CardDescription>
            Analytics and metrics coming soon
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Performance metrics, conversion rates, and detailed analytics will be
            available here.
          </p>
        </CardContent>
      </Card>

      {/* Celebration Modal */}
      <FirstCampaignCelebration
        open={showCelebration}
        onClose={handleCloseCelebration}
        campaignName={campaign?.name}
      />
    </div>
  );
}
