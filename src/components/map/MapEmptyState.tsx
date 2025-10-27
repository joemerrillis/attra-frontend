import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function MapEmptyState() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)] px-6 text-center">
      <MapPin className="w-16 h-16 text-muted-foreground/50 mb-6" />

      <h2 className="text-2xl font-bold mb-2">No locations yet</h2>

      <p className="text-muted-foreground mb-6 max-w-md">
        Your map will show activity as people scan your QR codes at different locations.
      </p>

      <Button
        variant="accent"
        onClick={() => navigate('/campaigns/new')}
      >
        {'>'}● Create Your First Campaign
      </Button>
    </div>
  );
}
