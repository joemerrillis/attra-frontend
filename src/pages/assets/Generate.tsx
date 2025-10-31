import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { assetApi } from '@/lib/asset-api';
import type { AssetType } from '@/types/asset';
import { FileText, DoorOpen, Triangle, CreditCard, BookOpen, ArrowLeft, ArrowRight, Check } from 'lucide-react';

const ASSET_TYPES = [
  { value: 'flyer' as AssetType, label: 'Flyer', description: '8.5" x 11" flyer', icon: FileText },
  { value: 'door_hanger' as AssetType, label: 'Door Hanger', description: '4.25" x 11" hanger', icon: DoorOpen },
  { value: 'table_tent' as AssetType, label: 'Table Tent', description: 'Folded display', icon: Triangle },
  { value: 'business_card' as AssetType, label: 'Business Card', description: '3.5" x 2" card', icon: CreditCard },
  { value: 'menu_board' as AssetType, label: 'Menu Board', description: 'Menu display', icon: BookOpen },
];

export default function AssetGenerate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  // Form state
  const [assetType, setAssetType] = useState<AssetType>('flyer');
  const [messageTheme, setMessageTheme] = useState('');
  const [headline, setHeadline] = useState('');
  const [subheadline, setSubheadline] = useState('');
  const [cta, setCta] = useState('');

  const handleGenerate = async () => {
    if (!user) return;

    setIsGenerating(true);
    try {
      const response = await assetApi.generate(user.id, {
        asset_type: assetType,
        message_theme: messageTheme,
        headline,
        subheadline: subheadline || undefined,
        cta: cta || undefined,
        locations: [], // TODO: Implement location selection
        background_mode: 'same',
        base_url: 'https://example.com', // TODO: Get base_url from tenant settings
      });

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
    if (step === 2) return messageTheme.trim() !== '' && headline.trim() !== '';
    return true;
  };

  const steps = [
    { number: 1, title: 'Choose Type' },
    { number: 2, title: 'Create Message' },
    { number: 3, title: 'Generate' },
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
              <div className={`w-12 md:w-24 h-0.5 mx-4 ${step > s.number ? 'bg-accent' : 'bg-border'}`} />
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

      {/* Step 2: Create Message */}
      {step === 2 && (
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

      {/* Step 3: Review & Generate */}
      {step === 3 && (
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

        {step < 3 && (
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
