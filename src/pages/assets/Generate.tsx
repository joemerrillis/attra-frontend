import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLoadScript, Autocomplete } from '@react-google-maps/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { assetApi } from '@/lib/asset-api';
import { locationApi } from '@/lib/location-api';
import { themeVocabularyApi } from '@/lib/theme-vocabulary-api';
import { backgroundApi } from '@/lib/background-api';
import { supabase } from '@/lib/supabase';
import type { AssetType } from '@/types/asset';
import type { ThemeVocabulary } from '@/types/theme-vocabulary';
import { FileText, DoorOpen, Triangle, CreditCard, BookOpen, ArrowLeft, ArrowRight, Check, MapPin, Loader2 } from 'lucide-react';

const ASSET_TYPES = [
  { value: 'flyer' as AssetType, label: 'Flyer', description: '8.5" x 11" flyer', icon: FileText },
  { value: 'door_hanger' as AssetType, label: 'Door Hanger', description: '4.25" x 11" hanger', icon: DoorOpen },
  { value: 'table_tent' as AssetType, label: 'Table Tent', description: 'Folded display', icon: Triangle },
  { value: 'business_card' as AssetType, label: 'Business Card', description: '3.5" x 2" card', icon: CreditCard },
  { value: 'menu_board' as AssetType, label: 'Menu Board', description: 'Menu display', icon: BookOpen },
];

const SUGGESTED_KEYWORDS = [
  'vibrant', 'bright', 'fresh', 'warm', 'cozy',
  'energetic', 'calm', 'bold', 'elegant', 'casual',
  'modern', 'classic', 'playful', 'sophisticated', 'inviting',
  'lively', 'social', 'intimate', 'exciting', 'refined',
  'rustic', 'luxurious', 'minimalist', 'dramatic', 'cheerful'
];

const MOOD_FAMILIES = [
  'Bright and Inviting',
  'Energetic and Dynamic',
  'Cool and Modern',
  'Elegant and Minimal',
  'Playful and Bold',
  'Warm and Local',
  'Focused and Dramatic',
  'Calm and Trustworthy'
] as const;

// Map display labels to database keys
const MOOD_FAMILY_TO_KEY: Record<string, string> = {
  'Bright and Inviting': 'bright_inviting',
  'Energetic and Dynamic': 'energetic_dynamic',
  'Cool and Modern': 'cool_modern',
  'Elegant and Minimal': 'elegant_minimal',
  'Playful and Bold': 'playful_bold',
  'Warm and Local': 'warm_local',
  'Focused and Dramatic': 'focused_dramatic',
  'Calm and Trustworthy': 'calm_trustworthy'
};

const libraries: ("places")[] = ['places'];

interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

export default function AssetGenerate() {
  const navigate = useNavigate();
  const { user, tenant } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  // Form state
  const [assetType, setAssetType] = useState<AssetType>('flyer');
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [messageTheme, setMessageTheme] = useState('');
  // Phase 1: Text fields removed from UI (will be added back in Phase 2 interactive editor)
  const [headline] = useState(''); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [subheadline] = useState(''); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [cta] = useState(''); // eslint-disable-line @typescript-eslint/no-unused-vars

  // Location state
  const [locations, setLocations] = useState<Location[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [activeTab, setActiveTab] = useState<'existing' | 'new'>('existing');

  // Theme vocabulary state
  const [userTheme, setUserTheme] = useState<ThemeVocabulary | null>(null);
  const [styleKeywords, setStyleKeywords] = useState<string[]>([]);
  const [moodFamily, setMoodFamily] = useState<string>('');

  // Background generation state
  const [isGeneratingBackground, setIsGeneratingBackground] = useState(false);
  const [generatedBackgroundId, setGeneratedBackgroundId] = useState<string | null>(null);
  const [generatedBackgroundUrl, setGeneratedBackgroundUrl] = useState<string | null>(null);
  const [backgroundUsage, setBackgroundUsage] = useState<{
    limit: number | null;
    current: number;
    remaining: number | null;
    isUnlimited: boolean;
  } | null>(null);

  // Batch mode state
  const [batchMode, setBatchMode] = useState<'batch' | 'individual'>('batch');
  const [generationProgress, setGenerationProgress] = useState<string>('');

  // Google Maps
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  // Fetch locations on mount
  useEffect(() => {
    const fetchLocations = async () => {
      setLoadingLocations(true);
      try {
        const response = await locationApi.list();
        const locs = Array.isArray(response) ? response : (response.locations || []);
        setLocations(locs);
      } catch (error) {
        console.error('Failed to fetch locations:', error);
        toast({
          title: 'Error loading locations',
          description: error instanceof Error ? error.message : 'Failed to load locations',
          variant: 'destructive',
        });
      } finally {
        setLoadingLocations(false);
      }
    };

    fetchLocations();
  }, [toast]);

  // Load theme vocabulary when messageTheme changes
  useEffect(() => {
    const loadTheme = async () => {
      const tenantId = (user as any)?.app_metadata?.tenant_id;
      if (messageTheme && tenantId) {
        try {
          const theme = await themeVocabularyApi.getTheme(
            tenantId,
            messageTheme
          );

          if (theme) {
            // Theme exists - auto-populate
            setUserTheme(theme);
            setStyleKeywords(theme.keywords);
            setMoodFamily((theme as any).moodFamily || theme.mood || '');
          } else {
            // New theme - empty fields
            setUserTheme(null);
            setStyleKeywords([]);
            setMoodFamily('');
          }
        } catch (error) {
          console.error('Error loading theme:', error);
          setUserTheme(null);
          setStyleKeywords([]);
          setMoodFamily('');
        }
      }
    };

    loadTheme();
  }, [messageTheme, user]);

  // Fetch background usage on mount
  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const usage = await backgroundApi.checkUsage();
        setBackgroundUsage(usage);
      } catch (error) {
        console.error('Failed to fetch background usage:', error);
      }
    };

    fetchUsage();
  }, []);

  /**
   * Poll job queue until background is complete
   */
  const pollForBackground = async (jobId: string): Promise<any> => {
    const maxAttempts = 60; // 60 seconds max
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const job = await backgroundApi.pollJobStatus(jobId);

        if (job.status === 'completed') {
          // Use job.result directly - it contains all needed data
          if (job.result && job.result.background_id) {
            return {
              id: job.result.background_id,
              image_url: job.result.image_url,
              thumbnail_url: job.result.thumbnail_url,
            };
          }
          throw new Error('Background data not found in job result');
        }

        if (job.status === 'failed') {
          throw new Error(job.last_error || 'Background generation failed');
        }

        // Still processing - wait 1 second and retry
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      } catch (error) {
        if (attempts >= maxAttempts - 1) {
          throw error; // Final attempt failed
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }
    }

    throw new Error('Background generation timeout - please try again');
  };

  /**
   * Generate background for Step 3
   */
  const handleGenerateBackground = async () => {
    if (!messageTheme || styleKeywords.length === 0) {
      toast({
        title: 'Missing Information',
        description: 'Please enter a message theme and select style keywords',
        variant: 'destructive',
      });
      return;
    }

    setIsGeneratingBackground(true);

    try {
      // Generate background
      const bgResult = await backgroundApi.generate({
        message_theme: messageTheme,
        style_keywords: styleKeywords,
        mood_family: moodFamily ? MOOD_FAMILY_TO_KEY[moodFamily] : undefined,
        generate_count: 1,
      });

      // Check for limit error
      if (bgResult.error && bgResult.code === 'LIMIT_REACHED') {
        setIsGeneratingBackground(false);

        toast({
          title: 'Background Limit Reached',
          description: bgResult.message || `You've used ${bgResult.current}/${bgResult.limit} backgrounds this month.`,
          variant: 'destructive',
        });
        return;
      }

      // Poll for completion
      const background = await pollForBackground(bgResult.job_ids[0]);

      console.log('[handleGenerateBackground] Background generated:', background.id);

      // Store background
      setGeneratedBackgroundId(background.id);
      setGeneratedBackgroundUrl(background.thumbnail_url);

      // Update usage count
      const usage = await backgroundApi.checkUsage();
      setBackgroundUsage(usage);

      toast({
        title: 'Background Generated!',
        description: 'Your background is ready. Click Next to continue.',
      });
    } catch (bgError) {
      console.error('[handleGenerateBackground] Background generation failed:', bgError);

      toast({
        title: 'Background Generation Failed',
        description: bgError instanceof Error ? bgError.message : 'Failed to generate background',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingBackground(false);
    }
  };

  const handleGenerate = async () => {
    if (!user) {
      console.error('❌ [handleGenerate] No user found');
      return;
    }

    console.log('🚀 [handleGenerate] Starting asset generation');
    console.log('👤 [handleGenerate] User ID:', user.id);
    console.log('🏢 [handleGenerate] Tenant ID:', tenant?.id);

    // ⭐ NEW: Ensure session is fresh before making API call
    console.log('🔐 [handleGenerate] Checking session before API call...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('❌ [handleGenerate] Session error:', sessionError);
      toast({
        title: 'Authentication Error',
        description: `Session error: ${sessionError.message}`,
        variant: 'destructive',
      });
      return;
    }

    if (!session) {
      console.error('❌ [handleGenerate] No session found');
      toast({
        title: 'Session Expired',
        description: 'Your session has expired. Please refresh the page and log in again.',
        variant: 'destructive',
      });
      return;
    }

    console.log('✅ [handleGenerate] Session is valid');
    console.log('📅 [handleGenerate] Session expires:', new Date(session.expires_at! * 1000).toISOString());

    // Check if session is about to expire (< 5 minutes remaining)
    const expiresIn = (session.expires_at! * 1000) - Date.now();
    const minutesRemaining = Math.floor(expiresIn / 1000 / 60);
    console.log('⏰ [handleGenerate] Session expires in:', minutesRemaining, 'minutes');

    if (expiresIn < 5 * 60 * 1000) {  // Less than 5 minutes
      console.warn('⚠️ [handleGenerate] Session expiring soon, refreshing...');
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error('❌ [handleGenerate] Failed to refresh session:', refreshError);
        toast({
          title: 'Session Refresh Failed',
          description: 'Please refresh the page and try again.',
          variant: 'destructive',
        });
        return;
      }
      console.log('✅ [handleGenerate] Session refreshed');
    }

    setIsGenerating(true);

    try {
      // Background should already be generated in Step 3
      const backgroundIdToUse = generatedBackgroundId;

      if (!backgroundIdToUse) {
        toast({
          title: 'Missing Background',
          description: 'Please generate a background first',
          variant: 'destructive',
        });
        setIsGenerating(false);
        return;
      }

      // Phase 1: Use placeholder text (Phase 2 will add interactive text editor)
      const headlineText = headline || messageTheme; // Use theme as placeholder
      const subheadlineText = subheadline || undefined;
      const ctaText = cta || undefined;

      // Generate assets
      console.log('[handleGenerate] Starting asset generation with background:', backgroundIdToUse);

      // Batch mode: Generate for multiple locations with progress
      if (batchMode === 'batch' && selectedLocations.length > 1) {
        console.log(`[Batch Mode] Generating for ${selectedLocations.length} locations`);

        let totalAssets = 0;
        for (let i = 0; i < selectedLocations.length; i++) {
          setGenerationProgress(`Generating for location ${i + 1} of ${selectedLocations.length}...`);

          try {
            const response = await assetApi.generate({
              asset_type: assetType,
              message_theme: messageTheme,
              headline: headlineText,
              subheadline: subheadlineText,
              cta: ctaText,
              locations: [selectedLocations[i]], // Single location
              background_mode: 'same',
              background_id: backgroundIdToUse,
              base_url: 'https://example.com',
            });

            totalAssets += response.assets.length;
            console.log(`[Batch Mode] Completed location ${i + 1}/${selectedLocations.length}`);
          } catch (error) {
            console.error(`[Batch Mode] Failed for location ${i + 1}:`, error);
            toast({
              title: `Failed for location ${i + 1}`,
              description: error instanceof Error ? error.message : 'Generation failed',
              variant: 'destructive',
            });
            // Continue with next location
          }
        }

        setGenerationProgress('');

        toast({
          title: 'Batch generation complete!',
          description: `Created ${totalAssets} ${assetType}(s) for ${selectedLocations.length} locations`,
        });
      } else {
        // Single location or individual mode - use original logic
        const response = await assetApi.generate({
          asset_type: assetType,
          message_theme: messageTheme,
          headline: headlineText,
          subheadline: subheadlineText,
          cta: ctaText,
          locations: selectedLocations,
          background_mode: 'same',
          background_id: backgroundIdToUse,
          base_url: 'https://example.com',
        });

        console.log('✅ [handleGenerate] Asset generation response received');

        toast({
          title: 'Assets generating!',
          description: `Creating ${response.assets.length} ${assetType}(s)...`,
        });
      }

      // ⭐ AUTO-SAVE: Theme vocabulary
      if (messageTheme && styleKeywords.length > 0) {
        try {
          const tenantId = (user as any)?.app_metadata?.tenant_id;
          if (tenantId) {
            await themeVocabularyApi.saveTheme(
              tenantId,
              messageTheme,
              styleKeywords,
              moodFamily || undefined
            );
            console.log(`[Auto-Save] Saved theme "${messageTheme}"`);
          }
        } catch (saveError) {
          console.error('[Auto-Save] Failed to save theme:', saveError);
        }
      }

      navigate('/map');
    } catch (error) {
      toast({
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'Failed to generate assets',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const canGoNext = () => {
    if (step === 1) return true; // Asset type has default value
    if (step === 2) return selectedLocations.length > 0;
    if (step === 3) return generatedBackgroundId !== null; // Must have generated background
    return true;
  };

  const handleSelectAll = () => {
    setSelectedLocations(locations.filter(Boolean).map(loc => loc.id));
  };

  const handleDeselectAll = () => {
    setSelectedLocations([]);
  };

  const toggleLocation = (locationId: string) => {
    setSelectedLocations(prev =>
      prev.includes(locationId)
        ? prev.filter(id => id !== locationId)
        : [...prev, locationId]
    );
  };

  const onAutocompleteLoad = (autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance);
  };

  const onPlaceChanged = async () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();

      if (!place.address_components) {
        toast({
          title: 'Invalid address',
          description: 'Please select a valid address from the dropdown',
          variant: 'destructive',
        });
        return;
      }

      // Extract address components
      const addressComponents = place.address_components || [];
      const getComponent = (type: string) =>
        addressComponents.find(c => c.types.includes(type))?.long_name || '';

      const streetNumber = getComponent('street_number');
      const route = getComponent('route');
      const address = streetNumber && route ? `${streetNumber} ${route}` : route || place.formatted_address || '';

      const newLocationData = {
        name: place.name || address || 'New Location',
        address,
        city: getComponent('locality'),
        state: getComponent('administrative_area_level_1'),
        zip: getComponent('postal_code'),
      };

      try {
        const newLocation = await locationApi.create(newLocationData);

        setLocations(prev => [...prev, newLocation]);
        setSelectedLocations(prev => [...prev, newLocation.id]);
        setActiveTab('existing'); // Switch to show the new location

        toast({
          title: 'Location added!',
          description: `${newLocation.name} has been created and selected`,
        });
      } catch (error) {
        toast({
          title: 'Failed to create location',
          description: error instanceof Error ? error.message : 'Failed to create location',
          variant: 'destructive',
        });
      }
    }
  };

  const filteredLocations = locations.filter(loc =>
    loc?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc?.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc?.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const steps = [
    { number: 1, title: 'Type' },
    { number: 2, title: 'Locations' },
    { number: 3, title: 'Message' },
    { number: 4, title: 'Generate' },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((s, idx) => (
          <div key={s.number} className="flex items-center">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                step >= s.number
                  ? 'bg-accent border-accent text-white'
                  : 'border-muted-foreground text-muted-foreground'
              }`}
            >
              {step > s.number ? (
                <Check className="w-5 h-5" />
              ) : (
                <span className="font-medium">{s.number}</span>
              )}
            </div>
            <span className={`ml-2 text-sm font-medium ${step >= s.number ? 'text-foreground' : 'text-muted-foreground'}`}>
              {s.title}
            </span>
            {idx < steps.length - 1 && (
              <div className={`w-8 md:w-16 h-0.5 mx-2 md:mx-4 ${step > s.number ? 'bg-accent' : 'bg-border'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Choose Asset Type */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Choose Asset Type</CardTitle>
            <CardDescription>Select what you want to create</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={assetType} onValueChange={(value) => setAssetType(value as AssetType)}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ASSET_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <label
                      key={type.value}
                      className={`flex items-center space-x-3 border-2 rounded-lg p-4 cursor-pointer transition-all min-h-[44px] ${
                        assetType === type.value
                          ? 'border-accent bg-accent/5'
                          : 'border-border hover:border-accent/50'
                      }`}
                    >
                      <RadioGroupItem value={type.value} id={type.value} />
                      <div className="flex items-center gap-3 flex-1">
                        <Icon className="w-6 h-6 text-accent" />
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-sm text-muted-foreground">{type.description}</div>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Select Locations */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Locations</CardTitle>
            <CardDescription>
              Choose which locations will receive this {ASSET_TYPES.find(t => t.value === assetType)?.label.toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'existing' | 'new')} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="existing">Existing Locations</TabsTrigger>
                <TabsTrigger value="new">Add New Location</TabsTrigger>
              </TabsList>

              {/* Existing Locations Tab */}
              <TabsContent value="existing" className="space-y-4">
                {loadingLocations ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : locations.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">No locations yet</p>
                    <p className="text-sm text-muted-foreground">
                      Switch to the "Add New Location" tab to create your first location
                    </p>
                  </div>
                ) : (
                  <>
                    <Input
                      placeholder="Search locations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-12 text-lg"
                    />

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={handleSelectAll} className="min-h-[44px]">
                        Select All
                      </Button>
                      <Button variant="outline" onClick={handleDeselectAll} className="min-h-[44px]">
                        Deselect All
                      </Button>
                    </div>

                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {filteredLocations.filter(Boolean).map(loc => (
                        <label
                          key={loc.id}
                          className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-accent/5 min-h-[44px] transition-colors"
                        >
                          <Checkbox
                            checked={selectedLocations.includes(loc.id)}
                            onCheckedChange={() => toggleLocation(loc.id)}
                          />
                          <div className="flex-1">
                            <div className="font-medium">{loc.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {loc.address}, {loc.city}, {loc.state} {loc.zip}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>

                    {selectedLocations.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {selectedLocations.length} location{selectedLocations.length !== 1 ? 's' : ''} selected
                      </p>
                    )}
                  </>
                )}
              </TabsContent>

              {/* Add New Location Tab */}
              <TabsContent value="new" className="space-y-4">
                {!isLoaded ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Loading Google Maps...</span>
                  </div>
                ) : (
                  <>
                    <Autocomplete
                      onLoad={onAutocompleteLoad}
                      onPlaceChanged={onPlaceChanged}
                    >
                      <Input
                        type="text"
                        placeholder="Start typing an address..."
                        className="h-12 text-lg"
                      />
                    </Autocomplete>

                    <p className="text-sm text-muted-foreground">
                      Start typing to search for an address. The location will be saved and automatically selected.
                    </p>
                  </>
                )}
              </TabsContent>
            </Tabs>

            {selectedLocations.length === 0 && (
              <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded p-3 mt-4">
                ⚠️ Select at least one location to continue
              </p>
            )}

            {/* Batch Mode Prompt */}
            {selectedLocations.length > 1 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Generate for {selectedLocations.length} locations
                </h3>
                <p className="text-sm text-blue-700 mb-4">
                  Do you want to use the same design for all locations?
                </p>

                <RadioGroup value={batchMode} onValueChange={(value) => setBatchMode(value as 'batch' | 'individual')}>
                  <div className="space-y-3">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <RadioGroupItem value="batch" id="batch" />
                      <div className="flex-1">
                        <div className="font-medium text-blue-900">Yes, same design</div>
                        <div className="text-sm text-blue-600">
                          Create one design and apply it to all {selectedLocations.length} locations.
                          Faster and consistent branding.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3 cursor-pointer">
                      <RadioGroupItem value="individual" id="individual" />
                      <div className="flex-1">
                        <div className="font-medium text-blue-900">No, customize each location</div>
                        <div className="text-sm text-blue-600">
                          Create unique designs for each location. You'll be prompted to continue after each one.
                        </div>
                      </div>
                    </label>
                  </div>
                </RadioGroup>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Generate Background */}
      {step === 3 && (
        <>
          {/* Batch Mode Indicator */}
          {batchMode === 'batch' && selectedLocations.length > 1 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-green-800">
                <Check className="w-5 h-5" />
                <span className="font-medium">
                  This design will be used for all {selectedLocations.length} locations
                </span>
              </div>
            </div>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Generate Background</CardTitle>
                  <CardDescription>Define your visual style</CardDescription>
                </div>

              {/* Background Usage Indicator */}
              {backgroundUsage && !backgroundUsage.isUnlimited && (
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">
                    Backgrounds: {backgroundUsage.current}/{backgroundUsage.limit}
                  </span>
                  {backgroundUsage.remaining !== null && backgroundUsage.remaining <= 1 && (
                    <span className="ml-2 text-orange-600 font-semibold">
                      ({backgroundUsage.remaining} left)
                    </span>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4 md:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="theme">Message Theme *</Label>
              <Input
                id="theme"
                value={messageTheme}
                onChange={(e) => setMessageTheme(e.target.value)}
                placeholder="e.g., Fall Sale 2024, Grand Opening"
                className="h-12 text-lg"
                required
              />
              <p className="text-sm text-muted-foreground">For your reference</p>
            </div>

            {/* Theme Vocabulary - Always Visible */}
            {messageTheme && (
              <div className="space-y-4 mb-6">
                {/* Status Card */}
                {userTheme ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">✅</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-green-900">
                          We remember "{messageTheme}"!
                        </h4>
                        {((userTheme as any).moodFamily || userTheme.mood) && (
                          <p className="text-sm text-green-700 mt-1 italic">
                            {(userTheme as any).moodFamily || userTheme.mood}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">🎨</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-900">
                          Let's define "{messageTheme}"
                        </h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Tell us what this flyer should feel like and look like
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Keywords Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    What does this flyer <span className="underline">look like</span>? (Pick 3-5 adjectives)
                  </label>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {SUGGESTED_KEYWORDS.map(keyword => (
                      <button
                        key={keyword}
                        type="button"
                        onClick={() => {
                          if (styleKeywords.includes(keyword)) {
                            setStyleKeywords(styleKeywords.filter(k => k !== keyword));
                          } else if (styleKeywords.length < 5) {
                            setStyleKeywords([...styleKeywords, keyword]);
                          }
                        }}
                        disabled={!styleKeywords.includes(keyword) && styleKeywords.length >= 5}
                        className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                          styleKeywords.includes(keyword)
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400 disabled:opacity-40 disabled:cursor-not-allowed'
                        }`}
                      >
                        {keyword}
                      </button>
                    ))}
                  </div>

                  {/* Selected Display */}
                  {styleKeywords.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-blue-900 mb-2">
                        Selected ({styleKeywords.length}/5):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {styleKeywords.map(kw => (
                          <span
                            key={kw}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded-full text-sm"
                          >
                            {kw}
                            <button
                              type="button"
                              onClick={() => setStyleKeywords(styleKeywords.filter(k => k !== kw))}
                              className="hover:text-blue-200 ml-1"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Mood Family Selector */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    What does this flyer <span className="underline">feel like</span>? (Optional mood family)
                  </label>
                  <RadioGroup value={moodFamily} onValueChange={setMoodFamily}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {MOOD_FAMILIES.map((family) => (
                        <label
                          key={family}
                          className={`flex items-center space-x-3 border-2 rounded-lg p-3 cursor-pointer transition-all ${
                            moodFamily === family
                              ? 'border-accent bg-accent/5'
                              : 'border-border hover:border-accent/50'
                          }`}
                        >
                          <RadioGroupItem value={family} id={family} />
                          <span className="text-sm font-medium">{family}</span>
                        </label>
                      ))}
                    </div>
                  </RadioGroup>
                  {moodFamily && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMoodFamily('')}
                      className="mt-2 text-muted-foreground hover:text-foreground"
                    >
                      Clear selection
                    </Button>
                  )}
                </div>

                {/* Background Generation Section */}
                {!generatedBackgroundUrl && (
                  <div className="mt-6">
                    <Button
                      onClick={handleGenerateBackground}
                      disabled={isGeneratingBackground || styleKeywords.length === 0}
                      className="w-full h-14 text-lg"
                      size="lg"
                    >
                      {isGeneratingBackground ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Generating Background...
                        </>
                      ) : (
                        'Generate Background'
                      )}
                    </Button>
                    {isGeneratingBackground && (
                      <p className="text-sm text-muted-foreground text-center mt-3">
                        This usually takes 5-10 seconds...
                      </p>
                    )}
                    {styleKeywords.length === 0 && (
                      <p className="text-sm text-amber-600 text-center mt-2">
                        Please select at least one style keyword first
                      </p>
                    )}
                  </div>
                )}

                {/* Show generated background preview */}
                {generatedBackgroundUrl && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">✅</div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-green-900">
                            Background Generated!
                          </h4>
                          <p className="text-sm text-green-700 mt-1">
                            Your "{messageTheme}" background is ready
                          </p>
                        </div>
                      </div>
                      <img
                        src={generatedBackgroundUrl}
                        alt="Generated background preview"
                        className="rounded-lg border border-green-300 w-full"
                      />
                      <Button
                        variant="outline"
                        onClick={() => {
                          setGeneratedBackgroundId(null);
                          setGeneratedBackgroundUrl(null);
                        }}
                        className="w-full"
                      >
                        Not quite right? Generate Again
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        </>
      )}

      {/* Step 4: Generate Asset (Temporary for Phase 1 - will become interactive editor in Phase 2) */}
      {step === 4 && (
        <>
          {/* Batch Mode Indicator */}
          {batchMode === 'batch' && selectedLocations.length > 1 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-green-800">
                <Check className="w-5 h-5" />
                <span className="font-medium">
                  This design will be used for all {selectedLocations.length} locations
                </span>
              </div>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Generate Asset</CardTitle>
              <CardDescription>Your background is ready - generate your {ASSET_TYPES.find(t => t.value === assetType)?.label.toLowerCase()}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Background Preview */}
              {generatedBackgroundUrl && (
                <div>
                  <p className="text-sm font-medium mb-2">Your Background:</p>
                  <img
                    src={generatedBackgroundUrl}
                    alt="Generated background"
                    className="rounded-lg border-2 w-full max-w-md mx-auto"
                  />
                </div>
              )}

              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Locations</p>
                  <p className="font-medium">
                    {selectedLocations.length} location{selectedLocations.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Theme</p>
                  <p className="font-medium">{messageTheme}</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground text-center">
                Note: Text editing will be available in the next update
              </p>

              {/* Progress UI for batch generation */}
              {isGenerating && batchMode === 'batch' && selectedLocations.length > 1 && generationProgress && (
                <div className="text-center py-6 space-y-3">
                  <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                  <p className="text-lg font-medium">{generationProgress}</p>
                  <p className="text-sm text-muted-foreground">Please don't close this window</p>
                </div>
              )}

              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full min-h-[44px]"
                size="lg"
              >
                {isGenerating ? 'Generating...' : `Generate ${ASSET_TYPES.find(t => t.value === assetType)?.label}`}
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between gap-4">
        <Button
          variant="outline"
          onClick={() => step > 1 ? setStep(step - 1) : navigate('/dashboard')}
          className="min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {step > 1 ? 'Back' : 'Cancel'}
        </Button>

        {step < 4 && (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canGoNext()}
            className="min-h-[44px]"
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
