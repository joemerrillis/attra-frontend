import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Calendar, TrendingUp, X } from 'lucide-react';
import { campaignApi } from '@/lib/campaign-api';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function CampaignsIndex() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: campaignApi.list,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => campaignApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast({
        title: 'Campaign deleted',
        description: 'The campaign has been successfully removed.',
      });
      setCampaignToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete campaign',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const campaignList = Array.isArray(campaigns) ? campaigns : [];

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            <span className="text-gray-400">&gt;●</span> Campaigns
          </h1>
          <p className="text-muted-foreground">
            Manage your marketing campaigns
          </p>
        </div>

        <Button onClick={() => navigate('/campaigns/new')}>
          <Plus className="w-4 h-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {/* Campaign List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading campaigns...</p>
        </div>
      ) : campaignList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
            <p className="text-muted-foreground mb-4 text-center">
              Create your first campaign to start tracking attribution
            </p>
            <Button onClick={() => navigate('/campaigns/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaignList.map((campaign: any) => {
            // If campaign is draft, navigate to wizard to complete it
            // Otherwise, navigate to detail page
            const handleClick = () => {
              if (campaign.status === 'draft') {
                navigate(`/campaigns/new?draft=${campaign.id}`);
              } else {
                navigate(`/campaigns/${campaign.id}`);
              }
            };

            return (
              <Card
                key={campaign.id}
                className="hover:border-primary/50 transition-colors cursor-pointer relative group"
                onClick={handleClick}
              >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{campaign.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                      {campaign.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCampaignToDelete(campaign.id);
                      }}
                    >
                      <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {campaign.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {campaign.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {campaign.created_at && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(campaign.created_at).toLocaleDateString()}
                    </div>
                  )}
                  {campaign.scans !== undefined && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {campaign.scans} scans
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!campaignToDelete} onOpenChange={(open) => !open && setCampaignToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this campaign and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => campaignToDelete && deleteMutation.mutate(campaignToDelete)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
