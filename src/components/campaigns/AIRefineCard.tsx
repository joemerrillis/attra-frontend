import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, X } from 'lucide-react';

interface Variation {
  headline: string;
  subheadline: string;
}

interface AIRefineCardProps {
  variations: Variation[];
  onSelect: (variation: Variation) => void;
  onDismiss: () => void;
}

export function AIRefineCard({ variations, onSelect, onDismiss }: AIRefineCardProps) {
  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">AI-Generated Variations</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <CardDescription>
          Click any variation to use it, or dismiss to keep writing your own
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {variations.map((variation, index) => (
          <Card
            key={index}
            className="cursor-pointer hover:border-blue-400 transition-all hover:shadow-md bg-white"
            onClick={() => onSelect(variation)}
          >
            <CardContent className="pt-6">
              <p className="font-semibold text-lg mb-2">{variation.headline}</p>
              <p className="text-muted-foreground">{variation.subheadline}</p>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
