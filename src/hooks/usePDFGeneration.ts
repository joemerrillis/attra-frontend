import { useMutation, useQuery } from '@tanstack/react-query';
import { pdfApi } from '@/lib/pdf-api';
import { useToast } from '@/hooks/use-toast';

interface GenerateFlyerData {
  campaignId: string;
  locationId: string;
  name: string;
  layout: 'classic' | 'modern' | 'minimal';
  headline: string;
  subheadline: string;
  cta: string;
  branding?: any;
}

export function usePDFGeneration(campaignId?: string) {
  const { toast } = useToast();

  const { data: assets, refetch: refetchAssets } = useQuery({
    queryKey: ['campaign-assets', campaignId],
    queryFn: () => pdfApi.getAssets(campaignId!),
    enabled: !!campaignId,
  });

  const generateMutation = useMutation({
    mutationFn: async (data: GenerateFlyerData) => {
      // Step 1: Create asset record with metadata
      const { asset } = await pdfApi.createAsset({
        name: data.name,
        asset_type: 'flyer',
        campaign_id: data.campaignId,
        metadata: {
          layout: data.layout,
          headline: data.headline,
          subheadline: data.subheadline,
          cta: data.cta,
          branding: data.branding,
        },
      });

      // Step 2: Generate PDF flyer from asset (queues background job)
      await pdfApi.generateFlyer(data.campaignId, {
        assetId: asset.id,
        locationId: data.locationId,
        layout: data.layout,
      });

      return asset;
    },
    onSuccess: () => {
      toast({
        title: 'PDF generation started',
        description: 'Your flyer is being generated. This may take a moment.',
      });
      // Poll for completion
      const pollInterval = setInterval(() => {
        refetchAssets();
      }, 3000);

      // Stop polling after 30 seconds
      setTimeout(() => clearInterval(pollInterval), 30000);
    },
    onError: (error: Error) => {
      toast({
        title: 'PDF generation failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    assets: (assets as any)?.assets || [],
    generate: generateMutation.mutate,
    isGenerating: generateMutation.isPending,
  };
}
