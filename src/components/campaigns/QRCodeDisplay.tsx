import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink } from 'lucide-react';
import { useQRLinks } from '@/hooks/useQRLinks';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeDisplayProps {
  campaignId: string;
}

export function QRCodeDisplay({ campaignId }: QRCodeDisplayProps) {
  const { data: qrData } = useQRLinks(campaignId);
  const { toast } = useToast();

  if (!qrData || !(qrData as any)?.qr_links || (qrData as any).qr_links.length === 0) {
    return null;
  }

  const qrLink = (qrData as any).qr_links[0];
  const shortUrl = `https://app.attra.io/q/${qrLink.id}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortUrl);
    toast({
      title: 'Copied!',
      description: 'Short link copied to clipboard',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-blue-600">●&gt;</span>
          Your QR Code
        </CardTitle>
        <CardDescription>
          This QR code is embedded in your PDF and will track every scan
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* QR Code */}
        <div className="flex justify-center">
          <div className="bg-white p-4 rounded border-2 border-gray-200">
            <QRCodeSVG
              value={shortUrl}
              size={200}
              level="H"
              includeMargin
            />
          </div>
        </div>

        {/* Short Link */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Short Link</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={shortUrl}
              readOnly
              className="flex-1 px-3 py-2 border rounded text-sm bg-gray-50"
            />
            <Button variant="outline" size="sm" onClick={copyToClipboard}>
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <a href={shortUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </div>

        {/* Destination URL */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Redirects To</label>
          <p className="text-sm text-muted-foreground break-all">
            {qrLink.redirect_url}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
