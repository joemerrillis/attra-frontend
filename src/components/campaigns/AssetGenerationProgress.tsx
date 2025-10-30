import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { pdfApi } from '@/lib/pdf-api';

interface AssetGenerationProgressProps {
  assetId: string;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

type JobStatus = 'queued' | 'processing' | 'complete' | 'failed';

export function AssetGenerationProgress({
  assetId,
  onComplete,
  onError,
}: AssetGenerationProgressProps) {
  const [status, setStatus] = useState<JobStatus>('queued');
  const [progress, setProgress] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    let timeInterval: NodeJS.Timeout;

    const pollStatus = async () => {
      try {
        const response = await pdfApi.getAssetStatus(assetId);
        console.log('📊 Asset status:', response);

        // Handle various status responses
        const assetStatus = response?.status || response?.asset?.status;

        if (assetStatus === 'completed' || response?.file_url) {
          setProgress(100);
          setStatus('complete');
          clearInterval(pollInterval);
          clearInterval(timeInterval);
          onComplete?.();
        } else if (assetStatus === 'failed' || assetStatus === 'error') {
          setStatus('failed');
          setErrorMessage(response?.error || 'Generation failed');
          clearInterval(pollInterval);
          clearInterval(timeInterval);
          onError?.(response?.error || 'Generation failed');
        } else if (assetStatus === 'processing' || assetStatus === 'generating') {
          setStatus('processing');
          // Estimate progress based on time elapsed (cap at 90% until actually complete)
          const estimatedTime = 30; // seconds
          const progressPercent = Math.min(90, (timeElapsed / estimatedTime) * 100);
          setProgress(progressPercent);
        } else {
          // Still queued or unknown status
          setStatus('queued');
        }
      } catch (error) {
        console.error('Failed to poll asset status:', error);
        // Don't fail immediately - keep polling
      }
    };

    // Start polling immediately
    pollStatus();

    // Poll every 2 seconds
    pollInterval = setInterval(pollStatus, 2000);

    // Track elapsed time every second
    timeInterval = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);

    // Cleanup on unmount
    return () => {
      clearInterval(pollInterval);
      clearInterval(timeInterval);
    };
  }, [assetId, onComplete, onError, timeElapsed]);

  const estimatedTimeRemaining = Math.max(0, 30 - timeElapsed);

  return (
    <div className="space-y-2 p-4 rounded-lg bg-muted/50">
      {status === 'queued' && (
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Queued...</p>
        </div>
      )}

      {status === 'processing' && (
        <>
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-medium">Generating flyer...</p>
            <p className="text-sm text-muted-foreground">{Math.round(progress)}%</p>
          </div>
          <Progress value={progress} className="h-2" />
          {timeElapsed > 10 && (
            <p className="text-xs text-muted-foreground">
              ~{estimatedTimeRemaining}s remaining
            </p>
          )}
        </>
      )}

      {status === 'complete' && (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="w-5 h-5" />
          <p className="text-sm font-medium">Complete! Ready to download</p>
        </div>
      )}

      {status === 'failed' && (
        <div className="flex items-center gap-2 text-red-600">
          <XCircle className="w-5 h-5" />
          <p className="text-sm font-medium">
            {errorMessage || 'Generation failed. Please try again.'}
          </p>
        </div>
      )}
    </div>
  );
}
