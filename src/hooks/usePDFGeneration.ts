import { useMutation, useQuery } from '@tanstack/react-query';
import { pdfApi } from '@/lib/pdf-api';
import { useToast } from '@/hooks/use-toast';

export function usePDFGeneration(campaignId?: string) {
  const { toast } = useToast();

  const { data: assets, refetch: refetchAssets } = useQuery({
    queryKey: ['campaign-assets', campaignId],
    queryFn: () => pdfApi.getAssets(campaignId!),
    enabled: !!campaignId,
  });

  const generateMutation = useMutation({
    mutationFn: ({ campaignId, layout }: { campaignId: string; layout: string }) =>
      pdfApi.generatePDF(campaignId, { layout } as any),
    onSuccess: () => {
      toast({
        title: 'PDF generation started',
        description: 'Your flyer is being generated. This may take a moment.',
      });
      // Poll for completion
      setTimeout(() => refetchAssets(), 3000);
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
