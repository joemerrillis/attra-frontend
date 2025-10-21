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
    queryFn: async () => {
      console.log('📥 Fetching assets for campaign:', campaignId);
      const result = await pdfApi.getAssets(campaignId!);
      console.log('📥 Assets response:', result);
      return result;
    },
    enabled: !!campaignId,
  });

  const generateMutation = useMutation({
    mutationFn: async (data: GenerateFlyerData) => {
      console.log('🚀 Starting PDF generation with data:', data);

      // Step 1: Create asset record with metadata and location
      console.log('📝 Step 1: Creating asset record...');
      const assetResponse = await pdfApi.createAsset({
        name: data.name,
        asset_type: 'flyer',
        campaign_id: data.campaignId,
        location_id: data.locationId,  // Link flyer to specific location
        metadata: {
          layout: data.layout,
          headline: data.headline,
          subheadline: data.subheadline,
          cta: data.cta,
          branding: data.branding,
        },
      });
      console.log('✅ Asset created:', assetResponse);

      // Step 2: Generate PDF flyer from asset (queues background job)
      console.log('📄 Step 2: Generating PDF flyer...');
      const generateResponse = await pdfApi.generateFlyer(data.campaignId, {
        assetId: assetResponse.asset.id,
        locationId: data.locationId,
        layout: data.layout,
      });
      console.log('✅ PDF generation queued:', generateResponse);

      return assetResponse.asset;
    },
    onSuccess: (asset) => {
      console.log('🎉 PDF generation mutation succeeded, asset:', asset);
      toast({
        title: 'PDF generation started',
        description: 'Your flyer is being generated. This may take a moment.',
      });
      // Poll for completion
      console.log('⏰ Starting poll for PDF completion (every 3s for 30s)');
      const pollInterval = setInterval(() => {
        console.log('🔄 Polling for asset updates...');
        refetchAssets();
      }, 3000);

      // Stop polling after 30 seconds
      setTimeout(() => {
        console.log('⏹️ Stopping asset polling after 30 seconds');
        clearInterval(pollInterval);
      }, 30000);
    },
    onError: (error: Error) => {
      console.error('❌ PDF generation mutation failed:', error);
      toast({
        title: 'PDF generation failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Log whenever assets data changes
  console.log('📊 usePDFGeneration state:', {
    campaignId,
    assetsData: assets,
    parsedAssets: (assets as any)?.assets || [],
    isGenerating: generateMutation.isPending,
  });

  return {
    assets: (assets as any)?.assets || [],
    generate: generateMutation.mutate,
    isGenerating: generateMutation.isPending,
  };
}
