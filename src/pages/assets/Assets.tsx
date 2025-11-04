import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useToast } from '@/hooks/use-toast';
import { assetApi } from '@/lib/asset-api';
import { Mail, Link2, Download, Trash2, MoreVertical, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Asset {
  id: string;
  asset_type: string;
  message_theme: string;
  headline?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  created_at: string;
  locations: {
    id: string;
    name: string;
  };
  campaign_backgrounds?: {
    public_url: string;
  };
  qr_codes?: {
    short_url: string;
  };
}

export default function Assets() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteAssetId, setDeleteAssetId] = useState<string | null>(null);

  // Fetch all assets
  const { data: assets, isLoading, error } = useQuery<Asset[]>({
    queryKey: ['assets'],
    queryFn: () => assetApi.list(),
  });

  // Delete asset mutation
  const deleteMutation = useMutation({
    mutationFn: (assetId: string) => assetApi.delete(assetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast({
        title: 'Asset deleted',
        description: 'The asset has been successfully deleted.',
      });
      setDeleteAssetId(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete asset',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Email to printer action
  const handleEmailToPrinter = async (asset: Asset) => {
    try {
      const imageUrl = asset.campaign_backgrounds?.public_url;
      if (!imageUrl) {
        throw new Error('No image URL available for this asset');
      }

      await assetApi.emailToPrinter({
        to: '', // User will fill this in Gmail draft
        subject: `Attra Marketing Asset - ${asset.locations.name}`,
        body: `
          <p>Hi,</p>
          <p>Your marketing asset for <strong>${asset.locations.name}</strong> is ready to print!</p>
          <p><strong>Asset Details:</strong></p>
          <ul>
            <li>Type: ${asset.asset_type}</li>
            <li>Theme: ${asset.message_theme}</li>
            ${asset.headline ? `<li>Headline: ${asset.headline}</li>` : ''}
          </ul>
          <p><strong>Image URL:</strong> <a href="${imageUrl}">${imageUrl}</a></p>
          <p><strong>Print Settings:</strong></p>
          <ul>
            <li>Size: 24" x 36" (2:3 ratio)</li>
            <li>Quality: 300 DPI</li>
            <li>Format: PNG</li>
          </ul>
          <p>Best regards,<br/>Attra</p>
        `,
      });

      toast({
        title: 'Draft created in Gmail',
        description: 'Check your Gmail inbox for the draft email.',
      });
    } catch (error: Error | any) {
      if (error.message?.includes('Gmail not connected')) {
        toast({
          title: 'Gmail not connected',
          description: 'Please connect your Gmail account in Settings.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Failed to create draft',
          description: error.message || 'Please try again',
          variant: 'destructive',
        });
      }
    }
  };

  // Copy link action
  const handleCopyLink = (asset: Asset) => {
    const url = asset.campaign_backgrounds?.public_url;
    if (url) {
      navigator.clipboard.writeText(url);
      toast({
        title: 'Link copied',
        description: 'Asset URL copied to clipboard.',
      });
    } else {
      toast({
        title: 'No URL available',
        description: 'This asset does not have a public URL yet.',
        variant: 'destructive',
      });
    }
  };

  // Download action
  const handleDownload = async (asset: Asset) => {
    const url = asset.campaign_backgrounds?.public_url;
    if (!url) {
      toast({
        title: 'No file available',
        description: 'This asset does not have a downloadable file yet.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${asset.message_theme}-${asset.locations.name}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast({
        title: 'Download started',
        description: 'Your asset is being downloaded.',
      });
    } catch (error) {
      toast({
        title: 'Download failed',
        description: 'Unable to download the asset. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container py-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Assets</h1>
            <p className="text-muted-foreground mt-1">Your marketing materials</p>
          </div>
          <Button onClick={() => navigate('/assets/generate')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Asset
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <Skeleton className="h-64 w-full" />
              <CardContent className="p-4">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container py-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Assets</h1>
            <p className="text-muted-foreground mt-1">Your marketing materials</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Failed to load assets. Please try again.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['assets'] })}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty state
  if (!assets || assets.length === 0) {
    return (
      <div className="container py-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Assets</h1>
            <p className="text-muted-foreground mt-1">Your marketing materials</p>
          </div>
          <Button onClick={() => navigate('/assets/generate')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Asset
          </Button>
        </div>

        <Card>
          <CardContent className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-semibold mb-2">No assets yet</h3>
              <p className="text-muted-foreground mb-6">
                Generate your first marketing asset to get started!
              </p>
              <Button onClick={() => navigate('/assets/generate')}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Asset
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main view with assets
  return (
    <div className="container py-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Assets</h1>
          <p className="text-muted-foreground mt-1">
            {assets.length} asset{assets.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => navigate('/assets/generate')}>
          <Plus className="w-4 h-4 mr-2" />
          Create Asset
        </Button>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assets.map((asset) => (
          <Card key={asset.id} className="overflow-hidden">
            {/* Asset Preview */}
            {asset.campaign_backgrounds?.public_url ? (
              <div className="relative aspect-[2/3] bg-muted">
                <img
                  src={asset.campaign_backgrounds.public_url}
                  alt={asset.message_theme}
                  className="object-cover w-full h-full"
                />
                {/* Status Badge Overlay */}
                <div className="absolute top-2 right-2">
                  <Badge
                    variant={
                      asset.status === 'completed' ? 'default' :
                      asset.status === 'generating' ? 'secondary' :
                      asset.status === 'failed' ? 'destructive' :
                      'outline'
                    }
                    className={asset.status === 'generating' ? 'animate-pulse' : ''}
                  >
                    {asset.status}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="aspect-[2/3] bg-muted flex items-center justify-center">
                <p className="text-sm text-muted-foreground">No preview available</p>
              </div>
            )}

            {/* Asset Info */}
            <CardContent className="p-4">
              <div className="space-y-2">
                <h3 className="font-semibold truncate">{asset.message_theme}</h3>
                <p className="text-sm text-muted-foreground truncate">
                  {asset.locations.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(asset.created_at), { addSuffix: true })}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEmailToPrinter(asset)}
                  disabled={asset.status !== 'completed'}
                  className="flex-1"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleCopyLink(asset)}
                      disabled={asset.status !== 'completed'}
                    >
                      <Link2 className="w-4 h-4 mr-2" />
                      Copy Link
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDownload(asset)}
                      disabled={asset.status !== 'completed'}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setDeleteAssetId(asset.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteAssetId} onOpenChange={() => setDeleteAssetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the asset
              and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAssetId && deleteMutation.mutate(deleteAssetId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
