import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  // Form state
  const [assetType, setAssetType] = useState<AssetType>('flyer');
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [messageTheme, setMessageTheme] = useState('');
  const [headline, setHeadline] = useState('');
  const [subheadline, setSubheadline] = useState('');
  const [cta, setCta] = useState('');

  // Location state
  const [locations, setLocations] = useState<Location[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [activeTab, setActiveTab] = useState<'existing' | 'new'>('existing');

  // Theme vocabulary state
  const [userTheme, setUserTheme] = useState<ThemeVocabulary | null>(null);
  const [styleKeywords, setStyleKeywords] = useState<string[]>([]);
  const [mood, setMood] = useState<string>('');

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
        const locs = response.locations || [];
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
            setMood(theme.mood || '');
          } else {
            // New theme - empty fields
            setUserTheme(null);
            setStyleKeywords([]);
            setMood('');
          }
        } catch (error) {
          console.error('Error loading theme:', error);
          setUserTheme(null);
          setStyleKeywords([]);
          setMood('');
        }
      }
    };

    loadTheme();
  }, [messageTheme, user]);

  const handleGenerate = async () => {
    if (!user) return;

    setIsGenerating(true);
    try {
      const response = await assetApi.generate({
        asset_type: assetType,
        message_theme: messageTheme,
        headline,
        subheadline: subheadline || undefined,
        cta: cta || undefined,
        locations: selectedLocations,
        background_mode: 'same',
        base_url: 'https://example.com', // TODO: Get base_url from tenant settings
      });

      // ⭐ AUTO-SAVE: After successful generation, save theme vocabulary
      if (response.success && messageTheme && styleKeywords.length > 0) {
        try {
          const tenantId = (user as any)?.app_metadata?.tenant_id;
          if (tenantId) {
            await themeVocabularyApi.saveTheme(
              tenantId,
              messageTheme,
              styleKeywords,
              mood || undefined
            );

            console.log(`[Auto-Save] Saved theme "${messageTheme}" with keywords:`, styleKeywords);
          }
        } catch (saveError) {
          // Don't block user flow if save fails
          console.error('[Auto-Save] Failed to save theme:', saveError);
        }
      }

      toast({
        title: 'Assets generating!',
        description: `Creating ${response.assets.length} ${assetType}(s)...`,
      });

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
    if (step === 3) return messageTheme.trim() !== '' && headline.trim() !== '';
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
          </CardContent>
        </Card>
      )}

      {/* Step 3: Create Message */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Create Your Message</CardTitle>
            <CardDescription>What do you want to say?</CardDescription>
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
                        {userTheme.mood && (
                          <p className="text-sm text-green-700 mt-1 italic">
                            {userTheme.mood}
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

                {/* Mood Field */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    What does this flyer <span className="underline">feel like</span>? (Optional mood)
                  </label>
                  <Input
                    type="text"
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    placeholder="e.g., sunny and uplifting, cozy and warm, energetic and fun..."
                    className="w-full"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="headline">Headline *</Label>
              <Textarea
                id="headline"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="50% Off Everything"
                className="min-h-[80px] text-lg"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subheadline">Subheadline (optional)</Label>
              <Textarea
                id="subheadline"
                value={subheadline}
                onChange={(e) => setSubheadline(e.target.value)}
                placeholder="September 15 - October 10"
                className="min-h-[60px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cta">Call to Action (optional)</Label>
              <Input
                id="cta"
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                placeholder="Shop Now, Visit Today, Call Us"
                className="h-12"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review & Generate */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Review & Generate</CardTitle>
            <CardDescription>Check your details before generating</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Asset Type</p>
                <p className="font-medium">{ASSET_TYPES.find(t => t.value === assetType)?.label}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Locations</p>
                <p className="font-medium">
                  {selectedLocations.length} location{selectedLocations.length !== 1 ? 's' : ''}
                </p>
                <div className="text-sm text-muted-foreground mt-1">
                  {locations
                    .filter(loc => selectedLocations.includes(loc.id))
                    .map(loc => loc?.name)
                    .filter(Boolean)
                    .join(', ')}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Theme</p>
                <p className="font-medium">{messageTheme}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Headline</p>
                <p className="font-medium">{headline}</p>
              </div>
              {subheadline && (
                <div>
                  <p className="text-sm text-muted-foreground">Subheadline</p>
                  <p className="font-medium">{subheadline}</p>
                </div>
              )}
              {cta && (
                <div>
                  <p className="text-sm text-muted-foreground">Call to Action</p>
                  <p className="font-medium">{cta}</p>
                </div>
              )}
            </div>

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
