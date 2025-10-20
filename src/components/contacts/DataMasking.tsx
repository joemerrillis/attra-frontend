import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface DataMaskingProps {
  value: string;
  masked: boolean;
}

export function DataMasking({ value, masked }: DataMaskingProps) {
  const navigate = useNavigate();

  if (!masked) {
    return <span className="font-medium">{value}</span>;
  }

  return (
    <div className="inline-flex items-center gap-2">
      <span className="text-gray-400 font-mono">{value}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/upgrade?feature=contact_details')}
        className="h-6 px-2 text-xs"
      >
        <Lock className="w-3 h-3 mr-1" />
        Unlock
      </Button>
    </div>
  );
}
