import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CampaignWizard } from '@/components/campaigns/CampaignWizard';
import { campaignApi } from '@/lib/campaign-api';

export default function NewCampaign() {
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get('draft');

  const { data: draftCampaign, isLoading } = useQuery({
    queryKey: ['campaign', draftId],
    queryFn: () => campaignApi.getById(draftId!),
    enabled: !!draftId,
  });

  if (draftId && isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading draft campaign...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <CampaignWizard
        initialData={draftCampaign ? {
          name: draftCampaign.name,
          goal: draftCampaign.goal,
          headline: draftCampaign.headline,
          subheadline: draftCampaign.subheadline,
          cta: draftCampaign.cta,
          layout: draftCampaign.layout,
        } : undefined}
        initialStep={draftCampaign ? 3 : 0} // Start at "Generate" step for drafts
      />
    </div>
  );
}
