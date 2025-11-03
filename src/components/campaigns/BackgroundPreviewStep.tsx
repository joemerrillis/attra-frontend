/**
 * BackgroundPreviewStep Component
 *
 * Step 3.5 in asset wizard - shows generated background preview before proceeding
 * User can confirm and proceed or go back to modify keywords
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, ArrowRight } from 'lucide-react';

interface BackgroundPreviewStepProps {
  generatedBackground: {
    id: string;
    image_url: string;
    thumbnail_url: string;
  } | null;
  isGenerating: boolean;
  keywords: string[];
  mood?: string;
  messageTheme: string;
  onConfirm: () => void;
  onBack: () => void;
}

export function BackgroundPreviewStep({
  generatedBackground,
  isGenerating,
  keywords,
  mood,
  messageTheme,
  onConfirm,
  onBack,
}: BackgroundPreviewStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview Your Background</CardTitle>
        <CardDescription>
          This background was generated based on your message theme
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Loading State */}
        {isGenerating && (
          <div className="flex flex-col items-center gap-6 py-8">
            <Loader2 className="w-16 h-16 animate-spin text-primary" />
            <div className="text-center space-y-3">
              <p className="font-medium text-lg">{messageTheme}</p>
              {keywords.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2">
                  {keywords.map((kw) => (
                    <span
                      key={kw}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              )}
              {mood && <p className="italic text-muted-foreground">"{mood}"</p>}
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                This usually takes 10-15 seconds...
              </p>
              <p className="text-xs text-muted-foreground">
                Using Flux 1.1 Pro AI to create your unique background
              </p>
            </div>
          </div>
        )}

        {/* Background Preview */}
        {!isGenerating && generatedBackground && (
          <div className="space-y-4">
            {/* Image Preview */}
            <div className="flex justify-center">
              <img
                src={generatedBackground.thumbnail_url}
                alt="Generated background preview"
                className="rounded-lg border-2 border-gray-300 max-w-md w-full shadow-lg"
              />
            </div>

            {/* Metadata */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">
                Generated with:
              </h4>
              <div className="space-y-2">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Theme:</span> {messageTheme}
                </p>
                {keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-sm font-medium text-blue-800">Keywords:</span>
                    {keywords.map((kw) => (
                      <span
                        key={kw}
                        className="px-2 py-0.5 bg-blue-500 text-white rounded text-xs"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
                {mood && (
                  <p className="text-sm text-blue-800 italic">
                    <span className="font-medium not-italic">Mood:</span> {mood}
                  </p>
                )}
              </div>
            </div>

            {/* Helper Text */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-sm text-muted-foreground text-center">
                💡 <span className="font-medium">Not what you expected?</span> Use the back button to adjust your keywords.
              </p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={onBack}
            disabled={isGenerating}
            className="min-h-[44px]"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isGenerating || !generatedBackground}
            className="min-h-[44px]"
          >
            Use This Background
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
