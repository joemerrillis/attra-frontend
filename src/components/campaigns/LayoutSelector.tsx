import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const LAYOUTS = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean, bold typography with plenty of whitespace',
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional layout with elegant serif fonts',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Simple and understated with maximum impact',
  },
];

interface LayoutSelectorProps {
  selected: string;
  onSelect: (layoutId: string) => void;
  headline?: string;
  subheadline?: string;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export function LayoutSelector({ selected, onSelect, headline, subheadline }: LayoutSelectorProps) {
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreviews();
  }, [headline, subheadline]); // Reload when copy changes

  const loadPreviews = async () => {
    try {
      // Get access token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Fetch all layout previews in parallel
      const previewPromises = LAYOUTS.map(async (layout) => {
        const response = await fetch(`${API_BASE}/api/internal/pdf/preview`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            layout: layout.id,
            headline: headline || 'Your Headline Here',
            subheadline: subheadline || 'Your subheadline goes here',
          }),
        });

        const html = await response.text();
        return { id: layout.id, html };
      });

      const results = await Promise.all(previewPromises);

      // Convert to object keyed by layout id
      const previewsObj = results.reduce((acc, { id, html }) => {
        acc[id] = html;
        return acc;
      }, {} as Record<string, string>);

      setPreviews(previewsObj);
    } catch (error) {
      console.error('Failed to load previews:', error);
    } finally {
      setLoading(false);
    }
  };
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
                <div className="bg-gray-100 rounded border border-gray-200 overflow-hidden flex items-center justify-center">
                  {loading ? (
                    <div className="w-full h-full flex items-center justify-center p-12">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : previews[layout.id] ? (
                    <div
                      style={{
                        width: '297.5px',
                        height: '385px',
                        overflow: 'hidden',
                        position: 'relative',
                      }}
                    >
                      <iframe
                        srcDoc={previews[layout.id]}
                        style={{
                          width: '850px',
                          height: '1100px',
                          transform: 'scale(0.35)',
                          transformOrigin: 'top left',
                          border: 'none',
                        }}
                        sandbox="allow-same-origin"
                        title={`${layout.name} preview`}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-12">
                      <span className="text-muted-foreground">Preview</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
