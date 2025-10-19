import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';

const LAYOUTS = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean, bold typography with plenty of whitespace',
    preview: '/previews/modern.svg',
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional layout with elegant serif fonts',
    preview: '/previews/classic.svg',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Simple and understated with maximum impact',
    preview: '/previews/minimal.svg',
  },
];

interface LayoutSelectorProps {
  selected: string;
  onSelect: (layoutId: string) => void;
}

export function LayoutSelector({ selected, onSelect }: LayoutSelectorProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Choose your flyer layout</h2>
        <p className="text-muted-foreground">
          Select a template that matches your brand personality
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {LAYOUTS.map((layout) => {
          const isSelected = selected === layout.id;

          return (
            <Card
              key={layout.id}
              className={`cursor-pointer transition-all hover:shadow-md relative ${
                isSelected
                  ? 'ring-2 ring-offset-2 ring-primary border-primary'
                  : 'hover:border-gray-400'
              }`}
              onClick={() => onSelect(layout.id)}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 bg-primary text-primary-foreground rounded-full p-1">
                  <Check className="w-4 h-4" />
                </div>
              )}

              <CardHeader>
                <CardTitle>{layout.name}</CardTitle>
                <CardDescription>{layout.description}</CardDescription>
              </CardHeader>

              <CardContent>
                <div className="aspect-[8.5/11] bg-gray-100 rounded border-2 border-gray-200 flex items-center justify-center">
                  <span className="text-muted-foreground">Preview</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
