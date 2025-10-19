import { useState } from 'react';
import { aiApi } from '@/lib/ai-api';
import { useToast } from '@/hooks/use-toast';

interface RefineCopyParams {
  goal: string;
  vertical: string;
  location_name?: string;
  additional_context?: string;
}

interface CopyVariation {
  headline: string;
  subheadline: string;
}

export function useAIRefine() {
  const [isRefining, setIsRefining] = useState(false);
  const [variations, setVariations] = useState<CopyVariation[]>([]);
  const { toast } = useToast();

  const generate = async (params: RefineCopyParams) => {
    setIsRefining(true);
    try {
      const response = await aiApi.generateCopy(params as any);
      setVariations((response as any).variations || []);
      return (response as any).variations;
    } catch (error: any) {
      toast({
        title: 'AI generation failed',
        description: error.message || 'Unable to generate copy variations. Please try again.',
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsRefining(false);
    }
  };

  const clear = () => {
    setVariations([]);
  };

  return {
    generate,
    clear,
    variations,
    isRefining,
  };
}
