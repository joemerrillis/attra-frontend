import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Eye, Share2, TrendingUp, CheckCircle } from 'lucide-react';

interface FirstCampaignCelebrationProps {
  open: boolean;
  onClose: () => void;
  campaignName?: string;
}

export function FirstCampaignCelebration({ open, onClose, campaignName }: FirstCampaignCelebrationProps) {
  // Trigger confetti when modal opens
  useEffect(() => {
    if (open) {
      // Fire confetti multiple times for extra celebration
      const duration = 3000;
      const end = Date.now() + duration;

      const colors = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B'];

      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: colors,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();

      // Big burst at the start
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: colors,
      });
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center animate-bounce">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>

          <DialogTitle className="text-2xl text-center">
            🎉 You Did It! 🎉
          </DialogTitle>

          <DialogDescription className="text-center text-base">
            <span className="font-semibold text-gray-900">
              Your first campaign is live!
            </span>
            {campaignName && (
              <div className="mt-2 text-sm text-gray-600">
                "{campaignName}" is now generating assets.
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Next Steps */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
            <h4 className="font-semibold text-sm text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              What happens next?
            </h4>

            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <Eye className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Assets are generating:</strong> Your flyers and postcards will be ready in a few minutes
                </span>
              </li>

              <li className="flex items-start gap-2">
                <Share2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Download and share:</strong> Once ready, download your assets and share with your audience
                </span>
              </li>

              <li className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-pink-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Track your results:</strong> Monitor QR code scans and engagement in your dashboard
                </span>
              </li>
            </ul>
          </div>

          {/* CTA Button */}
          <Button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            View My Campaign
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
