/**
 * BrandMomentForm Component
 *
 * Optional Step 2.5 in onboarding wizard
 * - Captures brand assets for AI background personalization
 * - Website URL (required)
 * - Instagram screenshots (optional, up to 3)
 * - Product images (optional, up to 3)
 * - "Skip for Now" button always available
 * - Auto-generates 1 background after capture
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, X, Sparkles, AlertCircle, Globe, Instagram, Package } from 'lucide-react';
import { useBrandingCapture } from '@/hooks/useBrandingCapture';
import { useBackgroundGeneration } from '@/hooks/useBackgroundGeneration';
import { useAuth } from '@/hooks/useAuth';

interface BrandMomentFormProps {
  onComplete: () => void;
  onSkip: () => void;
}

const MAX_INSTAGRAM_SCREENSHOTS = 3;
const MAX_PRODUCT_IMAGES = 3;
const MAX_FILE_SIZE_MB = 10;

export function BrandMomentForm({ onComplete, onSkip }: BrandMomentFormProps) {
  const { tenant } = useAuth();
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [instagramScreenshots, setInstagramScreenshots] = useState<File[]>([]);
  const [productImages, setProductImages] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { capture, isCapturing } = useBrandingCapture({
    tenantId: tenant?.id || '',
    onCaptureSuccess: () => {
      // After successful capture, auto-generate first background
      generate(undefined);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const { generate, isGenerating } = useBackgroundGeneration({
    tenantId: tenant?.id || '',
    onSuccess: () => {
      // Background generated successfully - move to next step
      onComplete();
    },
    onError: (err) => {
      console.error('Background generation failed:', err);
      // Still proceed even if generation fails
      onComplete();
    },
  });

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'instagram' | 'product'
  ) => {
    const files = Array.from(e.target.files || []);
    const setter = type === 'instagram' ? setInstagramScreenshots : setProductImages;
    const maxFiles = type === 'instagram' ? MAX_INSTAGRAM_SCREENSHOTS : MAX_PRODUCT_IMAGES;
    const currentFiles = type === 'instagram' ? instagramScreenshots : productImages;

    // Validate file sizes
    const invalidFiles = files.filter(f => f.size > MAX_FILE_SIZE_MB * 1024 * 1024);
    if (invalidFiles.length > 0) {
      setError(`Files must be under ${MAX_FILE_SIZE_MB}MB`);
      return;
    }

    // Add files up to limit
    const availableSlots = maxFiles - currentFiles.length;
    const newFiles = files.slice(0, availableSlots);
    setter([...currentFiles, ...newFiles]);
    setError(null);
  };

  const removeFile = (index: number, type: 'instagram' | 'product') => {
    const setter = type === 'instagram' ? setInstagramScreenshots : setProductImages;
    const files = type === 'instagram' ? instagramScreenshots : productImages;
    setter(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate website URL
    if (!websiteUrl.trim()) {
      setError('Website URL is required');
      return;
    }

    try {
      new URL(websiteUrl);
    } catch {
      setError('Please enter a valid website URL');
      return;
    }

    // Submit to backend
    capture({
      websiteUrl,
      instagramScreenshots: instagramScreenshots.length > 0 ? instagramScreenshots : undefined,
      productImages: productImages.length > 0 ? productImages : undefined,
    });
  };

  const isSubmitting = isCapturing || isGenerating;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary" />
        <h2 className="text-3xl font-bold mb-2">Capture Your Brand Moment</h2>
        <p className="text-muted-foreground">
          Help our AI understand your brand to create personalized backgrounds
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Website URL */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Website URL
              <span className="text-red-500">*</span>
            </CardTitle>
            <CardDescription>
              We'll analyze your website's design and branding
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              type="url"
              placeholder="https://yourbusiness.com"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </CardContent>
        </Card>

        {/* Instagram Screenshots */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Instagram className="w-5 h-5" />
              Instagram Screenshots
              <span className="text-sm font-normal text-muted-foreground">(Optional)</span>
            </CardTitle>
            <CardDescription>
              Upload up to {MAX_INSTAGRAM_SCREENSHOTS} screenshots of your Instagram feed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {instagramScreenshots.length < MAX_INSTAGRAM_SCREENSHOTS && (
              <div>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileChange(e, 'instagram')}
                  disabled={isSubmitting}
                  className="cursor-pointer"
                />
              </div>
            )}

            {instagramScreenshots.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {instagramScreenshots.map((file, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Instagram ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => removeFile(index, 'instagram')}
                      disabled={isSubmitting}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Images */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Product Images
              <span className="text-sm font-normal text-muted-foreground">(Optional)</span>
            </CardTitle>
            <CardDescription>
              Upload up to {MAX_PRODUCT_IMAGES} photos of your products or services
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {productImages.length < MAX_PRODUCT_IMAGES && (
              <div>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileChange(e, 'product')}
                  disabled={isSubmitting}
                  className="cursor-pointer"
                />
              </div>
            )}

            {productImages.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {productImages.map((file, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Product ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => removeFile(index, 'product')}
                      disabled={isSubmitting}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Status Message */}
        {isCapturing && (
          <Alert>
            <Upload className="w-4 h-4 animate-pulse" />
            <AlertDescription>Analyzing your brand assets...</AlertDescription>
          </Alert>
        )}

        {isGenerating && (
          <Alert>
            <Sparkles className="w-4 h-4 animate-pulse" />
            <AlertDescription>
              Generating your first AI background... This may take 5-10 seconds.
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onSkip}
            disabled={isSubmitting}
            className="w-full"
          >
            Skip for Now
          </Button>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Processing...' : 'Capture My Brand'}
          </Button>
        </div>
      </form>

      {/* Info Box */}
      <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2">Why capture your brand?</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• AI generates backgrounds that match your brand's style</li>
            <li>• Saves time creating on-brand marketing materials</li>
            <li>• You can always add more assets later</li>
            <li>• Skipping will use generic AI backgrounds instead</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
