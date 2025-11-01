import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Info } from 'lucide-react';
import { themeVocabularyApi } from '@/lib/theme-vocabulary-api';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import type { ThemeVocabulary } from '@/types/theme-vocabulary';

export function BrandingTab() {
  const [themes, setThemes] = useState<ThemeVocabulary[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      const tenantId = user?.app_metadata?.tenant_id;

      if (!tenantId) {
        throw new Error('No tenant ID found');
      }

      const data = await themeVocabularyApi.getAll(tenantId);
      setThemes(data.themes);
    } catch (error) {
      toast({
        title: 'Error loading themes',
        description: error instanceof Error ? error.message : 'Failed to load themes',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (themeName: string) => {
    if (!confirm(`Delete "${themeName}"? This won't affect existing assets, but you'll need to redefine it if you use it again.`)) {
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const tenantId = user?.app_metadata?.tenant_id;

      if (!tenantId) throw new Error('No tenant ID');

      await themeVocabularyApi.deleteTheme(tenantId, themeName);

      toast({
        title: 'Theme deleted',
        description: `"${themeName}" removed from vocabulary`
      });

      await loadThemes();
    } catch (error) {
      toast({
        title: 'Error deleting theme',
        description: error instanceof Error ? error.message : 'Failed to delete',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Message Theme Vocabulary Section */}
      <Card>
        <CardHeader>
          <CardTitle>📚 Your Theme Vocabulary</CardTitle>
          <CardDescription>
            These themes were automatically saved from your campaigns. They'll auto-apply when you create new flyers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1 text-sm text-blue-900">
                <p className="font-medium mb-1">How this works:</p>
                <p className="text-blue-700">
                  When you create a flyer, you define what it looks/feels like. We save that automatically.
                  Next time you use the same theme name, we'll remember your preferences!
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading themes...
            </div>
          ) : themes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-2">
                No themes saved yet.
              </p>
              <p className="text-sm text-gray-500">
                Create your first flyer to start building your vocabulary!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {themes.map(theme => (
                <div
                  key={theme.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-medium mb-2">{theme.theme_name}</h4>
                    <div className="flex flex-wrap gap-2">
                      {theme.keywords.map(keyword => (
                        <span
                          key={keyword}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                    {theme.mood && (
                      <p className="text-sm text-gray-500 mt-2 italic">"{theme.mood}"</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      Last updated: {new Date(theme.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(theme.theme_name)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Future: Brand Analysis Section */}
      <Card className="opacity-50">
        <CardHeader>
          <CardTitle>🎨 Brand Analysis</CardTitle>
          <CardDescription>Coming soon - AI-learned brand colors and styles</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            This section will show the colors, keywords, and mood that AI learned from your brand during onboarding.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
