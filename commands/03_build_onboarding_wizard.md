# Build Onboarding Wizard

## Objective
Create an outcome-based onboarding flow that guides new users through setting up their Attra account. The wizard should collect: vertical selection, branding, first location, and campaign goal. Upon completion, the system creates the tenant and redirects to campaign creation.

## Dependencies
- `02_build_auth_and_tenant_setup.md` (user authentication)
- Google Maps API key (for address autocomplete)

## Tech Stack
- **Forms:** React Hook Form + Zod validation
- **UI:** Shadcn/ui components
- **Maps:** Google Places Autocomplete API
- **File Upload:** Supabase Storage
- **State:** React useState for wizard steps

---

## Database Schema

### Ensure Tables Exist

```sql
-- Verticals configuration
CREATE TABLE IF NOT EXISTS public.verticals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  icon text, -- lucide icon name
  language_config jsonb, -- e.g., {"location_term": "building", "client_term": "resident"}
  created_at timestamptz DEFAULT NOW()
);

-- Tenant verticals (link tenant to vertical)
CREATE TABLE IF NOT EXISTS public.tenant_verticals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vertical_key text NOT NULL REFERENCES verticals(key),
  created_at timestamptz DEFAULT NOW(),
  UNIQUE(tenant_id)
);

-- Locations (where flyers will be distributed)
CREATE TABLE IF NOT EXISTS ops.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text NOT NULL,
  city text,
  state text,
  zip_code text,
  country text DEFAULT 'US',
  latitude numeric,
  longitude numeric,
  notes text,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE verticals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_verticals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops.locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can read verticals"
  ON verticals FOR SELECT
  USING (true);

CREATE POLICY "Users can view their tenant's vertical"
  ON tenant_verticals FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their locations"
  ON ops.locations FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their locations"
  ON ops.locations FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  );
```

### Seed Verticals

```sql
INSERT INTO verticals (key, name, description, icon, language_config) VALUES
('real_estate', 'Real Estate', 'Agents, brokers, and property managers', 'Home', 
  '{"location_term": "property", "client_term": "prospect", "service_term": "showing"}'),
('pet_services', 'Pet Services', 'Dog walking, pet sitting, grooming', 'Dog',
  '{"location_term": "building", "client_term": "pet owner", "service_term": "visit"}'),
('home_services', 'Home Services', 'Cleaning, repairs, maintenance', 'Wrench',
  '{"location_term": "property", "client_term": "homeowner", "service_term": "service"}'),
('landscaping', 'Landscaping', 'Lawn care, landscaping, snow removal', 'Leaf',
  '{"location_term": "property", "client_term": "homeowner", "service_term": "service"}'),
('professional', 'Professional Services', 'Consulting, coaching, other services', 'Briefcase',
  '{"location_term": "location", "client_term": "client", "service_term": "meeting"}')
ON CONFLICT (key) DO NOTHING;
```

---

## File Structure

```
src/
├── pages/
│   └── Onboarding.tsx
├── components/
│   └── onboarding/
│       ├── WizardLayout.tsx
│       ├── StepIndicator.tsx
│       ├── VerticalSelector.tsx
│       ├── BrandingForm.tsx
│       ├── LocationForm.tsx
│       └── CampaignGoalSelector.tsx
├── hooks/
│   └── useOnboarding.ts
└── lib/
    └── google-places.ts
```

---

## Implementation

### 1. Onboarding Hook

**File:** `src/hooks/useOnboarding.ts`

```typescript
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface OnboardingData {
  vertical: string;
  tenantName: string;
  logoFile: File | null;
  primaryColor: string;
  location: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    latitude: number | null;
    longitude: number | null;
  };
  campaignGoal: string;
}

export const useOnboarding = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completeOnboarding = async (data: OnboardingData) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Upload logo if provided
      let logoUrl: string | null = null;
      if (data.logoFile) {
        const fileExt = data.logoFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('logos')
          .upload(fileName, data.logoFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('logos')
          .getPublicUrl(fileName);

        logoUrl = publicUrl;
      }

      // 2. Create tenant
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: data.tenantName,
          logo_url: logoUrl,
          primary_color: data.primaryColor,
          slug: data.tenantName.toLowerCase().replace(/\s+/g, '-'),
        })
        .select()
        .single();

      if (tenantError) throw tenantError;

      // 3. Link user to tenant
      const { error: userTenantError } = await supabase
        .from('user_tenants')
        .insert({
          user_id: user.id,
          tenant_id: tenant.id,
          role: 'owner',
        });

      if (userTenantError) throw userTenantError;

      // 4. Set tenant vertical
      const { error: verticalError } = await supabase
        .from('tenant_verticals')
        .insert({
          tenant_id: tenant.id,
          vertical_key: data.vertical,
        });

      if (verticalError) throw verticalError;

      // 5. Create first location
      const { error: locationError } = await supabase
        .from('locations')
        .insert({
          tenant_id: tenant.id,
          name: data.location.name,
          address: data.location.address,
          city: data.location.city,
          state: data.location.state,
          zip_code: data.location.zipCode,
          latitude: data.location.latitude,
          longitude: data.location.longitude,
        });

      if (locationError) throw locationError;

      // 6. Store campaign goal in localStorage (used in next step)
      localStorage.setItem('attra_campaign_goal', data.campaignGoal);

      // 7. Refresh user context
      await refreshUser();

      // 8. Redirect to campaign wizard
      navigate('/campaigns/new');

    } catch (err) {
      console.error('Onboarding error:', err);
      setError('Failed to complete onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return { completeOnboarding, loading, error };
};
```

---

### 2. Google Places Helper

**File:** `src/lib/google-places.ts`

```typescript
// Load Google Places Autocomplete
export const loadGooglePlaces = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });
};

// Parse Google Places result
export const parsePlaceResult = (place: google.maps.places.PlaceResult) => {
  const getComponent = (type: string) => {
    return place.address_components?.find(c => c.types.includes(type))?.long_name || '';
  };

  return {
    address: place.formatted_address || '',
    city: getComponent('locality'),
    state: getComponent('administrative_area_level_1'),
    zipCode: getComponent('postal_code'),
    latitude: place.geometry?.location?.lat() || null,
    longitude: place.geometry?.location?.lng() || null,
  };
};
```

---

### 3. Wizard Layout

**File:** `src/components/onboarding/WizardLayout.tsx`

```typescript
import React from 'react';

interface WizardLayoutProps {
  currentStep: number;
  totalSteps: number;
  children: React.ReactNode;
}

export const WizardLayout: React.FC<WizardLayoutProps> = ({
  currentStep,
  totalSteps,
  children,
}) => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">
            ●<span className="text-blue-600">&gt;</span>attra<span className="text-blue-600">&gt;</span>●
          </h1>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round((currentStep / totalSteps) * 100)}% complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          {children}
        </div>
      </div>
    </div>
  );
};
```

---

### 4. Vertical Selector

**File:** `src/components/onboarding/VerticalSelector.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Home, Dog, Wrench, Leaf, Briefcase } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const iconMap: Record<string, React.ComponentType<any>> = {
  Home,
  Dog,
  Wrench,
  Leaf,
  Briefcase,
};

interface Vertical {
  key: string;
  name: string;
  description: string;
  icon: string;
}

interface VerticalSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export const VerticalSelector: React.FC<VerticalSelectorProps> = ({
  value,
  onChange,
}) => {
  const [verticals, setVerticals] = useState<Vertical[]>([]);

  useEffect(() => {
    loadVerticals();
  }, []);

  const loadVerticals = async () => {
    const { data, error } = await supabase
      .from('verticals')
      .select('key, name, description, icon')
      .order('name');

    if (!error && data) {
      setVerticals(data);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Choose Your Industry</h2>
      <p className="text-gray-600 mb-6">
        This helps us customize Attra for your business
      </p>

      <RadioGroup value={value} onValueChange={onChange}>
        <div className="space-y-3">
          {verticals.map((vertical) => {
            const Icon = iconMap[vertical.icon] || Briefcase;
            return (
              <Label
                key={vertical.key}
                htmlFor={vertical.key}
                className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:border-blue-300 transition-colors"
              >
                <RadioGroupItem
                  value={vertical.key}
                  id={vertical.key}
                  className="mt-1"
                />
                <Icon className="w-6 h-6 text-blue-600 mx-3 flex-shrink-0" />
                <div>
                  <div className="font-semibold">{vertical.name}</div>
                  <div className="text-sm text-gray-600">{vertical.description}</div>
                </div>
              </Label>
            );
          })}
        </div>
      </RadioGroup>
    </div>
  );
};
```

---

### 5. Branding Form

**File:** `src/components/onboarding/BrandingForm.tsx`

```typescript
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload } from 'lucide-react';

interface BrandingFormProps {
  tenantName: string;
  onTenantNameChange: (name: string) => void;
  logoFile: File | null;
  onLogoChange: (file: File | null) => void;
  primaryColor: string;
  onColorChange: (color: string) => void;
}

export const BrandingForm: React.FC<BrandingFormProps> = ({
  tenantName,
  onTenantNameChange,
  logoFile,
  onLogoChange,
  primaryColor,
  onColorChange,
}) => {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onLogoChange(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Add Your Branding</h2>
      <p className="text-gray-600 mb-6">
        This will appear on all your flyers and scan pages
      </p>

      <div className="space-y-6">
        {/* Business name */}
        <div>
          <Label htmlFor="businessName">Business Name *</Label>
          <Input
            id="businessName"
            value={tenantName}
            onChange={(e) => onTenantNameChange(e.target.value)}
            placeholder="Acme Dog Walking"
            className="mt-1"
          />
        </div>

        {/* Logo upload */}
        <div>
          <Label>Logo</Label>
          <div className="mt-1">
            <label
              htmlFor="logo-upload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors"
            >
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="max-h-28 object-contain"
                />
              ) : (
                <div className="text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Click to upload logo
                  </p>
                  <p className="text-xs text-gray-400">
                    PNG, JPG up to 5MB
                  </p>
                </div>
              )}
              <input
                id="logo-upload"
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Primary color */}
        <div>
          <Label htmlFor="primaryColor">Primary Color *</Label>
          <div className="flex items-center gap-3 mt-1">
            <input
              id="primaryColor"
              type="color"
              value={primaryColor}
              onChange={(e) => onColorChange(e.target.value)}
              className="w-12 h-12 rounded border border-gray-300 cursor-pointer"
            />
            <Input
              value={primaryColor}
              onChange={(e) => onColorChange(e.target.value)}
              placeholder="#3B82F6"
              className="flex-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
```

---

### 6. Location Form

**File:** `src/components/onboarding/LocationForm.tsx`

```typescript
import React, { useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loadGooglePlaces, parsePlaceResult } from '@/lib/google-places';

interface LocationData {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number | null;
  longitude: number | null;
}

interface LocationFormProps {
  location: LocationData;
  onLocationChange: (location: LocationData) => void;
}

export const LocationForm: React.FC<LocationFormProps> = ({
  location,
  onLocationChange,
}) => {
  const addressInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    initAutocomplete();
  }, []);

  const initAutocomplete = async () => {
    try {
      await loadGooglePlaces();
      
      if (addressInputRef.current) {
        const autocomplete = new google.maps.places.Autocomplete(
          addressInputRef.current,
          { types: ['address'] }
        );

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          const parsed = parsePlaceResult(place);
          
          onLocationChange({
            ...location,
            address: parsed.address,
            city: parsed.city,
            state: parsed.state,
            zipCode: parsed.zipCode,
            latitude: parsed.latitude,
            longitude: parsed.longitude,
          });
        });
      }
    } catch (error) {
      console.error('Failed to load Google Places:', error);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Add Your First Location</h2>
      <p className="text-gray-600 mb-6">
        Where will you be distributing your first flyers?
      </p>

      <div className="space-y-4">
        <div>
          <Label htmlFor="locationName">Location Name *</Label>
          <Input
            id="locationName"
            value={location.name}
            onChange={(e) => onLocationChange({ ...location, name: e.target.value })}
            placeholder="The Hamilton Building"
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            A memorable name for this location
          </p>
        </div>

        <div>
          <Label htmlFor="address">Address *</Label>
          <Input
            ref={addressInputRef}
            id="address"
            value={location.address}
            onChange={(e) => onLocationChange({ ...location, address: e.target.value })}
            placeholder="Start typing an address..."
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Google will autocomplete as you type
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={location.city}
              readOnly
              className="mt-1 bg-gray-50"
            />
          </div>
          <div>
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              value={location.state}
              readOnly
              className="mt-1 bg-gray-50"
            />
          </div>
          <div>
            <Label htmlFor="zipCode">ZIP</Label>
            <Input
              id="zipCode"
              value={location.zipCode}
              readOnly
              className="mt-1 bg-gray-50"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
```

---

### 7. Campaign Goal Selector

**File:** `src/components/onboarding/CampaignGoalSelector.tsx`

```typescript
import React from 'react';
import { Target, Users, Gift, Home as HomeIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface CampaignGoalSelectorProps {
  vertical: string;
  value: string;
  onChange: (value: string) => void;
}

const goalsByVertical: Record<string, Array<{ key: string; label: string; icon: any }>> = {
  real_estate: [
    { key: 'open_house', label: 'Promote an Open House', icon: HomeIcon },
    { key: 'new_listing', label: 'Announce a New Listing', icon: Target },
    { key: 'referrals', label: 'Generate Referrals', icon: Users },
  ],
  pet_services: [
    { key: 'new_clients', label: 'Get More Clients', icon: Target },
    { key: 'referrals', label: 'Generate Referrals', icon: Users },
    { key: 'promotion', label: 'Promote a Special Offer', icon: Gift },
  ],
  home_services: [
    { key: 'new_area', label: 'Expand to New Area', icon: Target },
    { key: 'promotion', label: 'Promote a Special Offer', icon: Gift },
    { key: 'referrals', label: 'Generate Referrals', icon: Users },
  ],
  landscaping: [
    { key: 'new_area', label: 'Expand to New Area', icon: Target },
    { key: 'seasonal', label: 'Seasonal Promotion', icon: Gift },
    { key: 'referrals', label: 'Generate Referrals', icon: Users },
  ],
  professional: [
    { key: 'awareness', label: 'Build Awareness', icon: Target },
    { key: 'referrals', label: 'Generate Referrals', icon: Users },
    { key: 'event', label: 'Promote an Event', icon: Gift },
  ],
};

export const CampaignGoalSelector: React.FC<CampaignGoalSelectorProps> = ({
  vertical,
  value,
  onChange,
}) => {
  const goals = goalsByVertical[vertical] || goalsByVertical.professional;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">What's Your Goal?</h2>
      <p className="text-gray-600 mb-6">
        We'll customize your first campaign based on what you're trying to achieve
      </p>

      <RadioGroup value={value} onValueChange={onChange}>
        <div className="space-y-3">
          {goals.map((goal) => {
            const Icon = goal.icon;
            return (
              <Label
                key={goal.key}
                htmlFor={goal.key}
                className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:border-blue-300 transition-colors"
              >
                <RadioGroupItem
                  value={goal.key}
                  id={goal.key}
                  className="flex-shrink-0"
                />
                <Icon className="w-6 h-6 text-blue-600 mx-3 flex-shrink-0" />
                <span className="font-medium">{goal.label}</span>
              </Label>
            );
          })}
        </div>
      </RadioGroup>
    </div>
  );
};
```

---

### 8. Main Onboarding Page

**File:** `src/pages/Onboarding.tsx`

```typescript
import React, { useState } from 'react';
import { WizardLayout } from '@/components/onboarding/WizardLayout';
import { VerticalSelector } from '@/components/onboarding/VerticalSelector';
import { BrandingForm } from '@/components/onboarding/BrandingForm';
import { LocationForm } from '@/components/onboarding/LocationForm';
import { CampaignGoalSelector } from '@/components/onboarding/CampaignGoalSelector';
import { useOnboarding } from '@/hooks/useOnboarding';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowRight, ArrowLeft } from 'lucide-react';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const { completeOnboarding, loading, error } = useOnboarding();

  // Form state
  const [vertical, setVertical] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [primaryColor, setPrimaryColor] = useState('#3B82F6');
  const [location, setLocation] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    latitude: null as number | null,
    longitude: null as number | null,
  });
  const [campaignGoal, setCampaignGoal] = useState('');

  const canProceed = () => {
    switch (step) {
      case 1:
        return vertical !== '';
      case 2:
        return tenantName.trim() !== '' && primaryColor !== '';
      case 3:
        return location.name.trim() !== '' && location.address.trim() !== '';
      case 4:
        return campaignGoal !== '';
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    await completeOnboarding({
      vertical,
      tenantName,
      logoFile,
      primaryColor,
      location,
      campaignGoal,
    });
  };

  return (
    <WizardLayout currentStep={step} totalSteps={4}>
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step content */}
      {step === 1 && (
        <VerticalSelector value={vertical} onChange={setVertical} />
      )}

      {step === 2 && (
        <BrandingForm
          tenantName={tenantName}
          onTenantNameChange={setTenantName}
          logoFile={logoFile}
          onLogoChange={setLogoFile}
          primaryColor={primaryColor}
          onColorChange={setPrimaryColor}
        />
      )}

      {step === 3 && (
        <LocationForm location={location} onLocationChange={setLocation} />
      )}

      {step === 4 && (
        <CampaignGoalSelector
          vertical={vertical}
          value={campaignGoal}
          onChange={setCampaignGoal}
        />
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between mt-8 pt-6 border-t">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={step === 1 || loading}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {step < 4 ? (
          <Button onClick={handleNext} disabled={!canProceed()}>
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleComplete}
            disabled={!canProceed() || loading}
          >
            {loading ? 'Setting up...' : 'Complete Setup'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </WizardLayout>
  );
}
```

---

## Environment Variables

Add to `.env`:

```bash
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

---

## Testing

### Manual Tests

- [ ] Onboarding wizard loads at `/onboarding`
- [ ] Step 1: Select vertical → can proceed
- [ ] Step 2: Enter business name + upload logo + choose color → can proceed
- [ ] Step 3: Enter location with autocomplete → city/state/zip auto-fill
- [ ] Step 4: Select campaign goal → can complete
- [ ] Click "Complete Setup" → tenant created
- [ ] Verify tenant in database with correct data
- [ ] Verify location created and linked to tenant
- [ ] Verify user_tenant relationship created
- [ ] Verify redirect to `/campaigns/new`
- [ ] Campaign goal stored in localStorage

### Database Verification

```sql
-- Check tenant was created
SELECT * FROM tenants WHERE name = 'Your Business Name';

-- Check vertical was set
SELECT * FROM tenant_verticals WHERE tenant_id = 'tenant-id-here';

-- Check location was created
SELECT * FROM ops.locations WHERE tenant_id = 'tenant-id-here';
```

---

## Acceptance Criteria

- [ ] 4-step wizard displays correctly
- [ ] Progress bar updates with each step
- [ ] Vertical selection works with icons
- [ ] Logo upload + preview works
- [ ] Color picker works
- [ ] Google Places autocomplete works
- [ ] Campaign goal options change by vertical
- [ ] "Back" button works
- [ ] "Next" button disabled until form valid
- [ ] Tenant + location created on completion
- [ ] Redirects to campaign creation
- [ ] Loading states during submission
- [ ] Error handling for failed requests

---

## Estimated Build Time

**5 hours**

## Priority

**Critical** - Required for new user setup

---

## Notes

- Google Places API key required (get from Google Cloud Console)
- Logo upload stored in Supabase Storage `logos` bucket
- Campaign goal stored in localStorage for next step
- Vertical determines language/terminology throughout app
- Simple validation - more robust validation can be added later
