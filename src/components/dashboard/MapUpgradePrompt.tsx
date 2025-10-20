import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function MapUpgradePrompt() {
  const navigate = useNavigate();

  return (
    <Card className="border-2 border-dashed border-muted-foreground/25 bg-muted/5">
      <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="mb-4 rounded-full bg-primary/10 p-4">
          <MapPin className="h-8 w-8 text-primary" />
        </div>

        <h3 className="text-xl font-semibold mb-2">
          See Where Your Scans Are Coming From
        </h3>

        <p className="text-muted-foreground mb-6 max-w-md">
          Visualize your scan locations on an interactive map. Track which neighborhoods
          are converting best and optimize your flyer distribution strategy.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => navigate('/upgrade?feature=map_view')}
            size="lg"
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Upgrade to Starter
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/upgrade')}
          >
            View Plans
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          Starting at $29/month
        </p>
      </CardContent>
    </Card>
  );
}
