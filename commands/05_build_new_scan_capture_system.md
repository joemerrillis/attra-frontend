# 05_build_scan_capture_system.md

## 🎯 Goal

Build a complete scan capture system that transforms physical flyer scans into digital contacts. This is the **●>** (physical → digital) core of Attra - the moment when someone in the real world sees your flyer, scans the QR code, and becomes a trackable lead.

**Timeline:** 6-8 hours  
**Priority:** CRITICAL - Core attribution feature

---

## 📋 Prerequisites

- ✅ `00_build_pull_contracts.md` executed (schema contracts available)
- ✅ `04_build_campaign_creation_system.md` completed (QR codes exist)
- ✅ Backend has QR redirect, scan tracking, and contacts endpoints deployed
- ✅ Supabase configured with contacts table

---

## 🧭 User Journey

This file builds the complete flow:

1. **Person scans QR code** → Lands on public capture page
2. **Sees branded form** → Tenant's logo, colors, campaign headline
3. **Enters contact info** → Name + email (2 fields only)
4. **Submits form** → Contact created in Attra
5. **Redirects to destination** → Tenant's URL with UTM tracking
6. **Scan logged** → Analytics updated in real-time

**Result:** Physical interest becomes digital attribution data.

---

## 🗂️ Complete File Structure

```
src/
├── pages/
│   └── public/
│       └── ScanLanding.tsx           (Main landing page /q/:id)
├── components/
│   └── scan/
│       ├── BrandedHeader.tsx         (Tenant logo + campaign headline)
│       ├── ContactCaptureForm.tsx    (Name + email form)
│       ├── PrivacyNotice.tsx         (Data usage transparency)
│       └── ScanSuccessModal.tsx      (Redirect countdown)
├── hooks/
│   ├── useScanTracking.ts            (Log scan event)
│   ├── useContactCapture.ts          (Create contact)
│   └── useQRLinkData.ts              (Fetch QR link details)
├── lib/
│   ├── scan-api.ts                   (Type-safe scan API client)
│   └── contact-api.ts                (Type-safe contact API client)
└── types/
    └── api.d.ts                      (Generated from OpenAPI schema)
```

---

## ⚙️ Step 1: Verify Schema Contracts

**These should already exist from `00_build_pull_contracts.md`:**

```bash
# Verify files exist
ls -la src/types/api.d.ts
ls -la src/types/backend.d.ts
ls -la src/lib/contracts/openapi.json
```

**If missing, pull them:**

```bash
curl https://api.attra.io/schema/openapi.json -o src/lib/contracts/openapi.json
curl https://api.attra.io/schema/types.d.ts -o src/types/backend.d.ts
pnpm dlx openapi-typescript src/lib/contracts/openapi.json -o src/types/api.d.ts
```

---

## ⚙️ Step 2: Install Additional Dependencies

```bash
pnpm add react-hook-form zod @hookform/resolvers
pnpm add @tanstack/react-query
pnpm add date-fns
```

---

## ⚙️ Step 3: Create Type-Safe API Clients

### Scan API Client

**File:** `src/lib/scan-api.ts`

```typescript
import type { paths } from '@/types/api';

type QRLinkResponse = paths['/api/internal/qr-links/{id}']['get']['responses']['200']['content']['application/json'];

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const scanApi = {
  /**
   * Get QR link details (public, no auth required)
   */
  async getQRLink(qrId: string): Promise<QRLinkResponse> {
    const response = await fetch(`${API_BASE}/api/internal/qr-links/${qrId}`);

    if (!response.ok) {
      throw new Error('QR code not found');
    }

    return response.json();
  },

  /**
   * Log scan event (public, no auth required)
   */
  async logScan(qrId: string, metadata: {
    user_agent?: string;
    referrer?: string;
    ip_address?: string;
  }): Promise<void> {
    await fetch(`${API_BASE}/q/${qrId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    });
  },

  /**
   * Get QR link analytics (requires auth)
   */
  async getAnalytics(qrId: string, token: string) {
    const response = await fetch(`${API_BASE}/api/internal/qr-links/${qrId}/analytics`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch analytics');
    }

    return response.json();
  },
};
```

### Contact API Client

**File:** `src/lib/contact-api.ts`

```typescript
import type { paths } from '@/types/api';

type CreateContactRequest = paths['/api/internal/contacts']['post']['requestBody']['content']['application/json'];
type ContactResponse = paths['/api/internal/contacts']['post']['responses']['200']['content']['application/json'];

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const contactApi = {
  /**
   * Create contact (public endpoint for scan captures)
   */
  async createFromScan(data: {
    name: string;
    email: string;
    qr_link_id: string;
    campaign_id?: string;
    metadata?: Record<string, any>;
  }): Promise<ContactResponse> {
    const response = await fetch(`${API_BASE}/api/internal/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        contact_kind: 'lead',
        metadata: {
          source: 'qr_scan',
          qr_link_id: data.qr_link_id,
          campaign_id: data.campaign_id,
          ...data.metadata,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to save contact' }));
      throw new Error(error.error || 'Failed to save contact');
    }

    return response.json();
  },

  /**
   * List contacts (requires auth)
   */
  async list(token: string) {
    const response = await fetch(`${API_BASE}/api/internal/contacts`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch contacts');
    }

    return response.json();
  },
};
```

---

## ⚙️ Step 4: Create React Hooks

### QR Link Data Hook

**File:** `src/hooks/useQRLinkData.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { scanApi } from '@/lib/scan-api';

export function useQRLinkData(qrId: string) {
  return useQuery({
    queryKey: ['qr-link', qrId],
    queryFn: () => scanApi.getQRLink(qrId),
    enabled: !!qrId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
}
```

### Scan Tracking Hook

**File:** `src/hooks/useScanTracking.ts`

```typescript
import { useEffect, useRef } from 'react';
import { scanApi } from '@/lib/scan-api';

export function useScanTracking(qrId: string) {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!qrId || hasTracked.current) return;

    const trackScan = async () => {
      try {
        await scanApi.logScan(qrId, {
          user_agent: navigator.userAgent,
          referrer: document.referrer,
          // IP captured server-side
        });
        hasTracked.current = true;
      } catch (error) {
        console.error('Failed to track scan:', error);
      }
    };

    trackScan();
  }, [qrId]);

  return { isTracked: hasTracked.current };
}
```

### Contact Capture Hook

**File:** `src/hooks/useContactCapture.ts`

```typescript
import { useMutation } from '@tanstack/react-query';
import { contactApi } from '@/lib/contact-api';

interface CaptureContactData {
  name: string;
  email: string;
  qr_link_id: string;
  campaign_id?: string;
}

export function useContactCapture() {
  const mutation = useMutation({
    mutationFn: (data: CaptureContactData) => contactApi.createFromScan(data),
  });

  return {
    capture: mutation.mutate,
    isCapturing: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
  };
}
```

---

## ⚙️ Step 5: Build Scan Landing Components

### Branded Header

**File:** `src/components/scan/BrandedHeader.tsx`

```typescript
import { Building2 } from 'lucide-react';

interface BrandedHeaderProps {
  tenantName: string;
  tenantLogo?: string;
  campaignHeadline?: string;
  campaignSubheadline?: string;
}

export function BrandedHeader({
  tenantName,
  tenantLogo,
  campaignHeadline,
  campaignSubheadline,
}: BrandedHeaderProps) {
  return (
    <div className="text-center mb-8">
      {/* ●> Symbol - Physical to Digital */}
      <div className="mb-4">
        <span className="text-5xl text-blue-600 font-bold">●></span>
      </div>

      {/* Tenant Logo */}
      {tenantLogo ? (
        <img
          src={tenantLogo}
          alt={tenantName}
          className="h-16 mx-auto mb-4"
        />
      ) : (
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-lg mb-4">
          <Building2 className="w-8 h-8 text-gray-400" />
        </div>
      )}

      {/* Campaign Headline */}
      {campaignHeadline && (
        <h1 className="text-3xl font-bold mb-2 text-gray-900">
          {campaignHeadline}
        </h1>
      )}

      {/* Campaign Subheadline */}
      {campaignSubheadline && (
        <p className="text-lg text-gray-600 mb-4 max-w-md mx-auto">
          {campaignSubheadline}
        </p>
      )}

      {/* Friendly Message */}
      <p className="text-sm text-gray-500">
        You scanned our flyer. Let's connect!
      </p>
    </div>
  );
}
```

### Contact Capture Form

**File:** `src/components/scan/ContactCaptureForm.tsx`

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowRight } from 'lucide-react';

const contactSchema = z.object({
  name: z.string().min(2, 'Please enter your name'),
  email: z.string().email('Please enter a valid email'),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface ContactCaptureFormProps {
  onSubmit: (data: ContactFormData) => void;
  isSubmitting: boolean;
  error?: Error | null;
  ctaText?: string;
}

export function ContactCaptureForm({
  onSubmit,
  isSubmitting,
  error,
  ctaText = 'Continue',
}: ContactCaptureFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {error.message || 'Failed to save your information. Please try again.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Name Field */}
      <div className="space-y-2">
        <Label htmlFor="name">Your Name *</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="John Smith"
          disabled={isSubmitting}
          className="text-lg h-12"
        />
        {errors.name && (
          <p className="text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email">Your Email *</Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          placeholder="john@example.com"
          disabled={isSubmitting}
          className="text-lg h-12"
        />
        {errors.email && (
          <p className="text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-12 text-lg"
        size="lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            {ctaText}
            <ArrowRight className="w-5 h-5 ml-2" />
          </>
        )}
      </Button>

      {/* Helper Text */}
      <p className="text-xs text-center text-gray-500">
        We'll only use this to follow up with you
      </p>
    </form>
  );
}
```

### Privacy Notice

**File:** `src/components/scan/PrivacyNotice.tsx`

```typescript
import { Shield, Eye, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function PrivacyNotice() {
  return (
    <Card className="border-blue-100 bg-blue-50">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-sm font-medium text-blue-900">
              Your privacy matters
            </p>
            <ul className="text-xs text-blue-800 space-y-1">
              <li className="flex items-center gap-2">
                <Eye className="w-3 h-3" />
                We only collect what you provide
              </li>
              <li className="flex items-center gap-2">
                <Lock className="w-3 h-3" />
                Your data is never sold or shared
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Success Modal

**File:** `src/components/scan/ScanSuccessModal.tsx`

```typescript
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScanSuccessModalProps {
  redirectUrl: string;
  tenantName: string;
  delay?: number; // seconds before auto-redirect
}

export function ScanSuccessModal({
  redirectUrl,
  tenantName,
  delay = 3,
}: ScanSuccessModalProps) {
  const [countdown, setCountdown] = useState(delay);

  useEffect(() => {
    if (countdown <= 0) {
      window.location.href = redirectUrl;
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, redirectUrl]);

  const handleManualRedirect = () => {
    window.location.href = redirectUrl;
  };

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-800">
          <CheckCircle2 className="w-6 h-6" />
          Thank you!
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-green-700">
          We've saved your information. {tenantName} will be in touch soon!
        </p>

        <div className="flex items-center justify-between">
          <p className="text-sm text-green-600">
            Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRedirect}
            className="border-green-600 text-green-700 hover:bg-green-100"
          >
            Continue Now
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## ⚙️ Step 6: Build Main Scan Landing Page

**File:** `src/pages/public/ScanLanding.tsx`

```typescript
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { BrandedHeader } from '@/components/scan/BrandedHeader';
import { ContactCaptureForm } from '@/components/scan/ContactCaptureForm';
import { PrivacyNotice } from '@/components/scan/PrivacyNotice';
import { ScanSuccessModal } from '@/components/scan/ScanSuccessModal';
import { useQRLinkData } from '@/hooks/useQRLinkData';
import { useScanTracking } from '@/hooks/useScanTracking';
import { useContactCapture } from '@/hooks/useContactCapture';

export default function ScanLanding() {
  const { id: qrId } = useParams<{ id: string }>();
  
  // Fetch QR link data
  const { data: qrData, isLoading, error: qrError } = useQRLinkData(qrId!);
  
  // Track scan event (runs once on mount)
  useScanTracking(qrId!);
  
  // Contact capture
  const { capture, isCapturing, isSuccess, error: captureError } = useContactCapture();

  // Handle form submission
  const handleSubmit = (data: { name: string; email: string }) => {
    if (!qrData) return;

    capture({
      name: data.name,
      email: data.email,
      qr_link_id: qrId!,
      campaign_id: qrData.campaign_id,
    });
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Error State - Invalid QR Code
  if (qrError || !qrData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2 text-gray-900">
              QR Code Not Found
            </h1>
            <p className="text-gray-600 mb-4">
              This QR code is invalid or has been deactivated.
            </p>
            <p className="text-sm text-gray-500">
              Please check the code and try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Extract data
  const tenant = qrData.tenant || {};
  const campaign = qrData.campaign || {};
  const redirectUrl = qrData.redirect_url || qrData.base_url;

  // Success State - Show redirect countdown
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <ScanSuccessModal
            redirectUrl={redirectUrl}
            tenantName={tenant.name}
            delay={3}
          />
        </div>
      </div>
    );
  }

  // Main Capture Form State
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="shadow-xl">
          <CardContent className="pt-8 pb-8">
            {/* Branded Header with ●> symbol */}
            <BrandedHeader
              tenantName={tenant.name}
              tenantLogo={tenant.branding?.logo_url}
              campaignHeadline={campaign.headline}
              campaignSubheadline={campaign.subheadline}
            />

            {/* Contact Capture Form */}
            <div className="space-y-6">
              <ContactCaptureForm
                onSubmit={handleSubmit}
                isSubmitting={isCapturing}
                error={captureError}
                ctaText={campaign.cta || 'Continue'}
              />

              {/* Privacy Notice */}
              <PrivacyNotice />
            </div>
          </CardContent>
        </Card>

        {/* Powered by Attra */}
        <p className="text-center text-xs text-gray-500 mt-4">
          Powered by{' '}
          <span className="font-semibold text-gray-700">●>attra>●</span>
        </p>
      </div>
    </div>
  );
}
```

---

## ⚙️ Step 7: Add Public Routes

Update `src/App.tsx`:

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ScanLanding from '@/pages/public/ScanLanding';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public QR Scan Routes - NO AUTH REQUIRED */}
          <Route path="/q/:id" element={<ScanLanding />} />
          <Route path="/go/:id" element={<ScanLanding />} />

          {/* ... other protected routes */}
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
```

---

## ⚙️ Step 8: Configure Public Route Handling

Since this is a public route that needs to work without authentication, ensure your auth guards don't block it.

**Update `src/components/auth/ProtectedRoute.tsx`:**

```typescript
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireTenant?: boolean;
}

export function ProtectedRoute({ children, requireTenant = true }: ProtectedRouteProps) {
  const { session, tenant, loading } = useAuth();
  const location = useLocation();

  // Allow public routes
  if (location.pathname.startsWith('/q/') || location.pathname.startsWith('/go/')) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireTenant && !tenant) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
```

---

## ✅ Acceptance Criteria

**Scan Landing Page:**
- [ ] Schema contracts verified and types available
- [ ] Public route `/q/:id` renders without auth
- [ ] Scan tracking logs on page load (once)
- [ ] QR link data fetches successfully
- [ ] Branded header displays tenant logo and campaign
- [ ] ●> symbol prominently displayed
- [ ] Contact form with name + email validation
- [ ] Form submits and creates contact
- [ ] Success modal shows with countdown
- [ ] Auto-redirects to destination URL after 3 seconds
- [ ] Manual redirect button works immediately
- [ ] Privacy notice displays clearly
- [ ] Error state for invalid QR codes
- [ ] Loading state during data fetch
- [ ] Mobile responsive design
- [ ] Works without authentication

**Type Safety:**
- [ ] All API calls use generated types
- [ ] No TypeScript errors
- [ ] Autocomplete works for API responses

**Analytics:**
- [ ] Scan event logged to backend
- [ ] Contact created with source metadata
- [ ] Campaign ID linked to contact
- [ ] Timestamp captured accurately

---

## 🧪 Testing Instructions

### Manual Testing Flow

1. **Generate Test QR Code**
   - Complete campaign creation (file 04)
   - Get QR link ID from campaign

2. **Test Scan Landing**
   ```bash
   # Start dev server
   pnpm run dev
   
   # Open scan URL in browser
   # Replace {id} with actual QR link ID
   http://localhost:3000/q/{id}
   ```

3. **Verify Branding**
   - Tenant logo displays
   - Campaign headline shows
   - ●> symbol visible
   - Colors match tenant branding

4. **Test Form Validation**
   - Submit empty form → validation errors
   - Enter name only → email error
   - Enter invalid email → format error
   - Enter valid data → submits successfully

5. **Test Success Flow**
   - Fill form and submit
   - Verify success modal appears
   - Watch countdown (should be 3 seconds)
   - Verify auto-redirect works
   - OR click "Continue Now" button

6. **Test Invalid QR Code**
   ```bash
   # Try with fake ID
   http://localhost:3000/q/invalid-id-123
   ```
   - Verify error page displays
   - Verify helpful error message

7. **Test Mobile Experience**
   - Open Chrome DevTools
   - Toggle device toolbar
   - Test on iPhone SE, Pixel 5
   - Verify form is usable
   - Verify buttons are tappable

8. **Verify Backend Integration**
   - Check browser network tab
   - Verify scan tracking POST request
   - Verify contact creation POST request
   - Check backend database for new contact
   - Verify metadata includes qr_link_id

---

## 🛠 Troubleshooting

### QR Code Not Found Error

**Problem:** Valid QR code shows "Not Found"

**Solutions:**
- Verify QR link exists in database
- Check backend logs for errors
- Verify API endpoint is correct
- Test with `curl https://api.attra.io/api/internal/qr-links/{id}`

### Scan Not Being Tracked

**Problem:** Scans don't appear in analytics

**Solutions:**
- Check browser console for errors
- Verify scan tracking endpoint works
- Check that `useScanTracking` hook is firing
- Verify backend receives POST to `/q/{id}`

### Contact Not Created

**Problem:** Form submits but contact doesn't save

**Solutions:**
- Check network tab for 400/500 errors
- Verify required fields match backend schema
- Check backend validation rules
- Verify tenant_id is passed correctly

### Redirect Not Working

**Problem:** Success modal shows but doesn't redirect

**Solutions:**
- Verify `redirect_url` exists in QR link data
- Check browser console for navigation errors
- Test redirect URL manually
- Verify countdown completes

---

## 🎨 Design Notes

**●> Branding Usage:**
- Hero symbol at top of page (large, blue)
- "Physical → Digital" moment emphasized
- Success messages reference "real-world interest"

**Mobile-First Design:**
- Large touch targets (48px minimum)
- Single-column layout
- Big, readable fonts (16px+)
- Generous spacing

**Speed Optimization:**
- Minimal JavaScript bundle
- Inline critical CSS
- Prefetch redirect URL
- Fast form validation

**Accessibility:**
- Form labels properly associated
- Error messages announced
- Keyboard navigation works
- Color contrast meets WCAG AA

---

## 🔒 Security Considerations

- **No Auth Required:** Public pages must work without login
- **Rate Limiting:** Backend prevents spam submissions
- **Input Validation:** Both client and server-side
- **CORS:** Backend allows scan tracking from any origin
- **Data Minimization:** Only collect name + email
- **Privacy:** Clear notice about data usage

---

## 📊 Performance Targets

- **Initial Load:** < 2 seconds on 3G
- **Form Submission:** < 500ms response time
- **Redirect:** Instant (no additional requests)
- **Bundle Size:** < 100KB JavaScript
- **Lighthouse Score:** 95+ performance

---

## 🔜 Future Enhancements

Not required for MVP but noted for later:

1. **Multi-Step Forms**
   - Conditional questions based on campaign type
   - Phone number capture (optional)
   - Custom fields per vertical

2. **Social Proof**
   - "X people scanned this today"
   - Testimonials from other contacts
   - Trust badges

3. **Rich Media**
   - Video intro from tenant
   - Photo gallery of services
   - Interactive product demos

4. **Smart Redirects**
   - Calendar booking integration
   - Payment links
   - Appointment scheduling

---

## ✅ Completion Checklist

- [ ] All code files created with complete implementations
- [ ] Schema contracts verified
- [ ] Public routes work without authentication
- [ ] Scan tracking logs successfully
- [ ] Contact creation works end-to-end
- [ ] Form validation prevents bad data
- [ ] Success modal and redirect work
- [ ] Error states handled gracefully
- [ ] Mobile responsive design verified
- [ ] ●> branding prominently displayed
- [ ] Privacy notice included
- [ ] All acceptance criteria met
- [ ] Manual testing completed
- [ ] No console errors
- [ ] Git commit made

---

**File Complete:** Production-ready scan capture system.  
**Claude Code:** Execute each step in sequence.  
**Result:** Functional QR scan landing pages that capture real-world interest as digital contacts.
