# Build Scan Landing Page System

## Objective
Create public-facing landing pages where people land after scanning QR codes. These pages are THE critical conversion point - capturing the contact's name and email before redirecting them. This is Attra's moat: lead capture as the default, not an afterthought.

## Dependencies
- ✅ Backend file 07 (QR links + UTM tracking)
- ✅ `02_build_auth_and_tenant_setup.md` (tenant branding data)
- ✅ Supabase public API (no auth required)

## Philosophy
**"If I took the time to scan a QR code... buy me lunch, bro."**
- Fast loading (<1 second)
- Mobile-first design (95% of scans are phones)
- Branded (tenant's logo + colors)
- 2 fields only: name + email
- Clear value prop: "Why should I give you my info?"

---

## Tech Stack
- **Frontend:** React (same app, public routes)
- **Forms:** React Hook Form + Zod
- **Styling:** Tailwind + Shadcn/ui
- **Deployment:** Same as main app (public routes don't need auth)

---

## User Flow

```
1. User sees QR code on flyer
   ↓
2. Opens camera, scans QR
   ↓
3. Lands on attra.io/s/{shortCode}
   ↓
4. Sees branded page:
   - Tenant's logo
   - Campaign headline
   - "Enter your info to continue"
   - Name + Email fields
   ↓
5. Submits form
   ↓
6. Contact created in Attra
   ↓
7. Redirected to tenant's URL (with params)
   ↓
8. Contact synced to tenant's Gmail (via 10a)
```

---

## File Structure

```
src/
├── pages/
│   └── public/
│       └── ScanLanding.tsx
├── components/
│   └── scan/
│       ├── BrandedHeader.tsx
│       ├── LeadCaptureForm.tsx
│       └── LoadingState.tsx
├── hooks/
│   └── useScanLanding.ts
└── lib/
    └── scan-utils.ts
```

---

## Database Schema (Reference)

These tables already exist from backend:

```sql
-- QR Links
CREATE TABLE ops.qr_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  short_code text UNIQUE NOT NULL, -- e.g., "x7K3mQ"
  campaign_id uuid NOT NULL REFERENCES ops.campaigns(id),
  location_id uuid REFERENCES ops.locations(id),
  redirect_url text NOT NULL, -- Where to send after capture
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamptz DEFAULT NOW()
);

-- QR Scans (tracking)
CREATE TABLE ops.qr_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_link_id uuid NOT NULL REFERENCES ops.qr_links(id),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  contact_id uuid REFERENCES ops.contacts(id), -- Set after form submission
  scanned_at timestamptz DEFAULT NOW(),
  user_agent text,
  ip_address inet,
  location jsonb -- Browser geolocation if available
);

-- Contacts
CREATE TABLE ops.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  source text DEFAULT 'qr_scan',
  campaign_id uuid REFERENCES ops.campaigns(id),
  location_id uuid REFERENCES ops.locations(id),
  created_at timestamptz DEFAULT NOW(),
  last_contacted_at timestamptz,
  status text DEFAULT 'new'
);
```

---

## Implementation

### 1. Scan Landing Hook

**File:** `src/hooks/useScanLanding.ts`

```typescript
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface ScanPageData {
  campaign: {
    id: string;
    name: string;
    headline: string;
    subheadline: string;
  };
  tenant: {
    id: string;
    name: string;
    logo_url: string;
    primary_color: string;
  };
  location?: {
    id: string;
    name: string;
    address: string;
  };
  qr_link_id: string;
  redirect_url: string;
}

export const useScanLanding = () => {
  const { shortCode } = useParams<{ shortCode: string }>();
  const [data, setData] = useState<ScanPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (shortCode) {
      loadScanPage();
      trackScan();
    }
  }, [shortCode]);

  const loadScanPage = async () => {
    try {
      // Get QR link with related data
      const { data: qrLink, error: qrError } = await supabase
        .from('qr_links')
        .select(`
          id,
          redirect_url,
          campaign:campaigns (
            id,
            name,
            headline,
            subheadline
          ),
          location:locations (
            id,
            name,
            address
          )
        `)
        .eq('short_code', shortCode)
        .single();

      if (qrError) throw qrError;

      // Get tenant info
      const { data: campaign } = await supabase
        .from('campaigns')
        .select(`
          tenant:tenants (
            id,
            name,
            logo_url,
            primary_color
          )
        `)
        .eq('id', qrLink.campaign.id)
        .single();

      setData({
        campaign: qrLink.campaign,
        tenant: campaign.tenant,
        location: qrLink.location,
        qr_link_id: qrLink.id,
        redirect_url: qrLink.redirect_url
      });
    } catch (err) {
      console.error('Failed to load scan page:', err);
      setError('Invalid QR code');
    } finally {
      setLoading(false);
    }
  };

  const trackScan = async () => {
    try {
      // Log the scan (without contact_id yet)
      await supabase.from('qr_scans').insert({
        qr_link_id: data?.qr_link_id,
        tenant_id: data?.tenant.id,
        scanned_at: new Date().toISOString(),
        user_agent: navigator.userAgent,
        // ip_address captured by backend
      });
    } catch (err) {
      console.error('Failed to track scan:', err);
    }
  };

  const submitContact = async (name: string, email: string) => {
    if (!data) throw new Error('No scan data loaded');

    try {
      // Create contact
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .insert({
          tenant_id: data.tenant.id,
          name,
          email,
          source: 'qr_scan',
          campaign_id: data.campaign.id,
          location_id: data.location?.id,
        })
        .select()
        .single();

      if (contactError) throw contactError;

      // Update most recent scan with contact_id
      await supabase
        .from('qr_scans')
        .update({ contact_id: contact.id })
        .eq('qr_link_id', data.qr_link_id)
        .order('scanned_at', { ascending: false })
        .limit(1);

      // Build redirect URL with params
      const redirectUrl = new URL(data.redirect_url);
      redirectUrl.searchParams.set('name', name);
      redirectUrl.searchParams.set('email', email);
      redirectUrl.searchParams.set('attra_contact_id', contact.id);

      return {
        success: true,
        redirectUrl: redirectUrl.toString(),
        contact
      };
    } catch (err) {
      console.error('Failed to submit contact:', err);
      throw err;
    }
  };

  return {
    data,
    loading,
    error,
    submitContact
  };
};
```

---

### 2. Branded Header Component

**File:** `src/components/scan/BrandedHeader.tsx`

```typescript
import React from 'react';

interface BrandedHeaderProps {
  logoUrl?: string;
  tenantName: string;
  primaryColor: string;
}

export const BrandedHeader: React.FC<BrandedHeaderProps> = ({
  logoUrl,
  tenantName,
  primaryColor
}) => {
  return (
    <div 
      className="py-6 px-4 text-center border-b"
      style={{ borderColor: `${primaryColor}20` }}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={tenantName}
          className="h-12 mx-auto mb-2"
        />
      ) : (
        <h1 
          className="text-2xl font-bold"
          style={{ color: primaryColor }}
        >
          {tenantName}
        </h1>
      )}
    </div>
  );
};
```

---

### 3. Lead Capture Form

**File:** `src/components/scan/LeadCaptureForm.tsx`

```typescript
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowRight } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email')
});

type FormData = z.infer<typeof formSchema>;

interface LeadCaptureFormProps {
  campaignName: string;
  onSubmit: (name: string, email: string) => Promise<void>;
  primaryColor: string;
}

export const LeadCaptureForm: React.FC<LeadCaptureFormProps> = ({
  campaignName,
  onSubmit,
  primaryColor
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(formSchema)
  });

  const onSubmitForm = async (data: FormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(data.name, data.email);
    } catch (err) {
      setError('Failed to submit. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="Your name"
          autoComplete="name"
          disabled={isSubmitting}
          className="mt-1"
        />
        {errors.name && (
          <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          placeholder="your@email.com"
          autoComplete="email"
          disabled={isSubmitting}
          className="mt-1"
        />
        {errors.email && (
          <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full"
        style={{ backgroundColor: primaryColor }}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </>
        )}
      </Button>

      <p className="text-xs text-center text-gray-500">
        We respect your privacy. Your information is secure.
      </p>
    </form>
  );
};
```

---

### 4. Main Scan Landing Page

**File:** `src/pages/public/ScanLanding.tsx`

```typescript
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScanLanding } from '@/hooks/useScanLanding';
import { BrandedHeader } from '@/components/scan/BrandedHeader';
import { LeadCaptureForm } from '@/components/scan/LeadCaptureForm';
import { Loader2, AlertCircle } from 'lucide-react';

export default function ScanLanding() {
  const navigate = useNavigate();
  const { data, loading, error, submitContact } = useScanLanding();

  const handleSubmit = async (name: string, email: string) => {
    const result = await submitContact(name, email);
    
    if (result.success) {
      // Redirect to tenant's URL
      window.location.href = result.redirectUrl;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Invalid QR Code</h1>
          <p className="text-gray-600 mb-6">
            This QR code is no longer valid or has expired.
          </p>
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:underline"
          >
            Go to homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Branded header */}
      <BrandedHeader
        logoUrl={data.tenant.logo_url}
        tenantName={data.tenant.name}
        primaryColor={data.tenant.primary_color}
      />

      {/* Main content */}
      <div className="max-w-md mx-auto px-4 py-8">
        {/* Campaign info */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-3">
            {data.campaign.headline}
          </h1>
          {data.campaign.subheadline && (
            <p className="text-lg text-gray-600">
              {data.campaign.subheadline}
            </p>
          )}
          {data.location && (
            <p className="text-sm text-gray-500 mt-2">
              📍 {data.location.name}
            </p>
          )}
        </div>

        {/* Value prop */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="font-semibold mb-2">
            Enter your info to continue
          </h2>
          <p className="text-sm text-gray-600">
            We'll send you more information about {data.campaign.name}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <LeadCaptureForm
            campaignName={data.campaign.name}
            onSubmit={handleSubmit}
            primaryColor={data.tenant.primary_color}
          />
        </div>

        {/* Powered by Attra (removable in paid tiers) */}
        <p className="text-center text-xs text-gray-400 mt-8">
          Powered by Attra
        </p>
      </div>
    </div>
  );
}
```

---

## Router Configuration

Update `src/App.tsx` to include public routes:

```typescript
import ScanLanding from '@/pages/public/ScanLanding';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes (no auth) */}
          <Route path="/s/:shortCode" element={<ScanLanding />} />
          
          {/* ... authenticated routes ... */}
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

---

## Performance Optimization

### Critical for Mobile:

```typescript
// Preload tenant logo
const { data } = useScanLanding();

useEffect(() => {
  if (data?.tenant.logo_url) {
    const img = new Image();
    img.src = data.tenant.logo_url;
  }
}, [data]);

// Autofocus first field on mobile
<Input
  {...register('name')}
  autoFocus={window.innerWidth > 768} // Only on desktop
/>
```

---

## Testing

### Manual Test Flow

1. **Create test campaign** with QR code
2. **Get short code** from database (e.g., `x7K3mQ`)
3. **Navigate to** `http://localhost:3000/s/x7K3mQ`
4. **Verify:**
   - Page loads < 1 second
   - Tenant logo displays
   - Campaign headline shows
   - Form has 2 fields (name, email)
5. **Fill form** and submit
6. **Verify:**
   - Contact created in database
   - Redirect to tenant's URL
   - URL params include name + email
7. **Test on mobile** (critical!)
   - Use Chrome DevTools mobile emulation
   - Test with real phone
   - Verify autofill works
   - Check form is easy to tap

### Lighthouse Score Targets

Run on mobile:
- **Performance:** 95+
- **Accessibility:** 100
- **Best Practices:** 95+
- **SEO:** 90+

---

## Edge Cases

### 1. Duplicate Email
```typescript
// Check if email already exists
const { data: existing } = await supabase
  .from('contacts')
  .select('id')
  .eq('tenant_id', data.tenant.id)
  .eq('email', email)
  .single();

if (existing) {
  // Update existing contact instead of creating new
  await supabase
    .from('contacts')
    .update({ 
      name,
      last_contacted_at: new Date().toISOString()
    })
    .eq('id', existing.id);
}
```

### 2. Invalid QR Code
- Show friendly error message
- Offer link to homepage
- Log error for debugging

### 3. Offline / Network Error
- Show "Please check your connection"
- Retry button
- Don't lose form data

---

## Feature Gating

### Free vs Paid Scan Pages

From `23_build_feature_gating_backend.md`:

**Free tier:**
- Shows "Powered by Attra" badge
- Standard template only

**Pro tier:**
- Remove Attra branding
- Custom CSS injection
- Custom domain (scan.yourbusiness.com)

---

## Acceptance Criteria

- [ ] Scan landing page loads at `/s/:shortCode`
- [ ] Page loads in < 1 second on 3G
- [ ] Tenant logo displays correctly
- [ ] Campaign headline + subheadline show
- [ ] Form has name + email fields only
- [ ] Form validation works (client + server)
- [ ] Autofill works on mobile
- [ ] Submit button shows loading state
- [ ] Contact created in database on submit
- [ ] Redirect to tenant's URL works
- [ ] URL params include name + email
- [ ] Scan is tracked in qr_scans table
- [ ] Works on mobile (90% of traffic)
- [ ] Invalid QR codes show error page
- [ ] Duplicate emails handled gracefully
- [ ] "Powered by Attra" badge visible (free tier)

---

## Security

### Prevent Spam

```typescript
// Rate limiting (backend)
// Max 5 submissions per IP per 10 minutes

// Honeypot field (frontend)
<input
  type="text"
  name="website"
  style={{ display: 'none' }}
  tabIndex={-1}
  autoComplete="off"
/>

// If honeypot filled, reject as spam
```

### GDPR Compliance

Add privacy policy link:
```typescript
<p className="text-xs text-center text-gray-500">
  By continuing, you agree to our{' '}
  <a href="/privacy" className="underline">Privacy Policy</a>
</p>
```

---

## Estimated Build Time

**6 hours**

## Priority

**CRITICAL** - This is THE conversion point. The entire product depends on this working flawlessly.

---

## Success Metrics

Track in analytics:
- Load time (target: < 1s on 3G)
- Bounce rate (target: < 30%)
- Form completion rate (target: > 70%)
- Mobile vs desktop traffic
- Time to first interaction

**If this page is slow or confusing, the whole product fails.**
