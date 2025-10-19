import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { campaignApi } from '@/lib/campaign-api';
import { useToast } from '@/hooks/use-toast';

export interface CampaignData {
  name: string;
  description?: string;
  goal?: string;
  headline?: string;
  subheadline?: string;
  cta?: string;
  layout?: 'classic' | 'modern' | 'minimal';
  status?: 'draft' | 'active' | 'paused' | 'completed';
}

export function useCampaign(campaignId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => campaignApi.getById(campaignId!),
    enabled: !!campaignId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CampaignData) => campaignApi.create(data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast({
        title: 'Campaign created',
        description: 'Your campaign has been created successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create campaign',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CampaignData> }) =>
      campaignApi.update(id, data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast({
        title: 'Campaign updated',
        description: 'Your changes have been saved.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update campaign',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    campaign,
    isLoading,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
