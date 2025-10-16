# Build QR & UTM Frontend

## Objective
Create frontend components to display QR codes, manage short links, and show UTM parameters. This is mostly for campaign detail pages where tenants can see their generated QR codes and tracking links.

## Dependencies
- ✅ Backend file 07 (QR/UTM generation already done)
- ✅ `04_build_campaign_wizard.md` (campaigns exist)
- ✅ QR codes generated during PDF creation

## Philosophy
**"QR codes are generated automatically. We just display them nicely."**
- Show QR code image
- Display short link
- Show UTM parameters (human-readable)
- Copy to clipboard functionality

---

## Tech Stack
- **React + TypeScript**
- **qrcode.react** for QR display
- **React Query** for data fetching
- **Clipboard API** for copy functionality

---

## File Structure

```
src/
├── components/
│   └── qr/
│       ├── QRCodeDisplay.tsx
│       ├── ShortLinkCard.tsx
│       ├── UTMParametersDisplay.tsx
│       └── CopyButton.tsx
└── hooks/
    └── useQRLinks.ts
```

---

## API Contract (Reference)

Backend already provides this from file 07:

```typescript
GET /api/qr-links?campaign_id={uuid}
{
  "qr_links": [
    {
      "id": "uuid",
      "short_code": "x7K3mQ",
      "campaign_id": "uuid",
      "location_id": "uuid",
      "redirect_url": "https://example.com/landing",
      "full_url": "https://app.attra.io/s/x7K3mQ",
      "utm_source": "qr",
      "utm_medium": "flyer",
      "utm_campaign": "open_house_oct_2025",
      "qr_image_url": "https://storage.supabase.co/.../qr.png"
    }
  ]
}
```

---

## Implementation

### 1. QR Links Hook

**File:** `src/hooks/useQRLinks.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export const useQRLinks = (campaignId: string) => {
  return useQuery({
    queryKey: ['qr-links', campaignId],
    queryFn: async () => {
      const response = await api.get(`/api/qr-links?campaign_id=${campaignId}`);
      return response.data.qr_links;
    },
    enabled: !!campaignId
  });
};
```

---

### 2. QR Code Display Component

**File:** `src/components/qr/QRCodeDisplay.tsx`

```typescript
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QRCodeDisplayProps {
  value: string; // The URL to encode
  size?: number;
  logoUrl?: string;
  showDownload?: boolean;
  label?: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  size = 200,
  logoUrl,
  showDownload = true,
  label
}) => {
  const handleDownload = () => {
    const canvas = document.getElementById(`qr-${value}`) as HTMLCanvasElement;
    if (!canvas) return;

    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = `qr-code-${label || 'attra'}.png`;
    link.click();
  };

  return (
    <div className="flex flex-col items-center space-y-3">
      {label && (
        <p className="text-sm font-medium text-gray-700">{label}</p>
      )}
      
      <div className="p-4 bg-white border-2 rounded-lg shadow-sm">
        <QRCodeSVG
          id={`qr-${value}`}
          value={value}
          size={size}
          level="H" // High error correction
          includeMargin={true}
          imageSettings={logoUrl ? {
            src: logoUrl,
            height: size * 0.2,
            width: size * 0.2,
            excavate: true
          } : undefined}
        />
      </div>

      {showDownload && (
        <Button
          onClick={handleDownload}
          variant="outline"
          size="sm"
        >
          <Download className="w-4 h-4 mr-2" />
          Download QR Code
        </Button>
      )}
    </div>
  );
};
```

---

### 3. Copy Button Component

**File:** `src/components/qr/CopyButton.tsx`

```typescript
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  text: string;
  label?: string;
  size?: 'sm' | 'default' | 'lg';
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  label = 'Copy',
  size = 'sm'
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <Button
      onClick={handleCopy}
      variant="outline"
      size={size}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 mr-2 text-green-600" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="w-4 h-4 mr-2" />
          {label}
        </>
      )}
    </Button>
  );
};
```

---

### 4. Short Link Card

**File:** `src/components/qr/ShortLinkCard.tsx`

```typescript
import React from 'react';
import { Card } from '@/components/ui/card';
import { ExternalLink, MapPin } from 'lucide-react';
import { CopyButton } from './CopyButton';

interface ShortLinkCardProps {
  shortCode: string;
  fullUrl: string;
  location?: {
    name: string;
    address: string;
  };
  scans?: number;
}

export const ShortLinkCard: React.FC<ShortLinkCardProps> = ({
  shortCode,
  fullUrl,
  location,
  scans = 0
}) => {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          {location && (
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <MapPin className="w-4 h-4 mr-1" />
              {location.name}
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <code className="text-lg font-mono font-semibold">
              attra.io/s/{shortCode}
            </code>
            <a
              href={fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        <CopyButton text={fullUrl} />
      </div>

      {scans > 0 && (
        <div className="text-sm text-gray-600 pt-2 border-t">
          {scans} scan{scans !== 1 ? 's' : ''}
        </div>
      )}
    </Card>
  );
};
```

---

### 5. UTM Parameters Display

**File:** `src/components/qr/UTMParametersDisplay.tsx`

```typescript
import React from 'react';
import { Card } from '@/components/ui/card';
import { Tag } from 'lucide-react';

interface UTMParametersDisplayProps {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
}

export const UTMParametersDisplay: React.FC<UTMParametersDisplayProps> = ({
  utmSource,
  utmMedium,
  utmCampaign,
  utmContent,
  utmTerm
}) => {
  const params = [
    { label: 'Source', value: utmSource, description: 'Where traffic comes from' },
    { label: 'Medium', value: utmMedium, description: 'Marketing medium' },
    { label: 'Campaign', value: utmCampaign, description: 'Campaign identifier' },
    { label: 'Content', value: utmContent, description: 'Content variation' },
    { label: 'Term', value: utmTerm, description: 'Keyword' }
  ].filter(p => p.value);

  if (params.length === 0) {
    return null;
  }

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-3 flex items-center">
        <Tag className="w-4 h-4 mr-2" />
        UTM Parameters
      </h3>
      
      <div className="space-y-2">
        {params.map((param) => (
          <div key={param.label} className="flex items-start">
            <dt className="text-sm font-medium text-gray-500 w-24">
              {param.label}:
            </dt>
            <dd className="text-sm text-gray-900 flex-1">
              <code className="bg-gray-100 px-2 py-1 rounded">
                {param.value}
              </code>
              <p className="text-xs text-gray-500 mt-1">
                {param.description}
              </p>
            </dd>
          </div>
        ))}
      </div>
    </Card>
  );
};
```

---

## Usage in Campaign Detail Page

```typescript
// pages/campaigns/Detail.tsx
import { useParams } from 'react-router-dom';
import { useQRLinks } from '@/hooks/useQRLinks';
import { QRCodeDisplay } from '@/components/qr/QRCodeDisplay';
import { ShortLinkCard } from '@/components/qr/ShortLinkCard';
import { UTMParametersDisplay } from '@/components/qr/UTMParametersDisplay';

export default function CampaignDetail() {
  const { campaignId } = useParams();
  const { data: qrLinks, isLoading } = useQRLinks(campaignId!);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Campaign QR Codes</h1>

      {/* QR Codes Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {qrLinks?.map((link: any) => (
          <div key={link.id} className="space-y-4">
            <QRCodeDisplay
              value={link.full_url}
              label={link.location?.name}
              size={180}
            />
            
            <ShortLinkCard
              shortCode={link.short_code}
              fullUrl={link.full_url}
              location={link.location}
              scans={link.scan_count}
            />
          </div>
        ))}
      </div>

      {/* UTM Parameters */}
      {qrLinks?.[0] && (
        <UTMParametersDisplay
          utmSource={qrLinks[0].utm_source}
          utmMedium={qrLinks[0].utm_medium}
          utmCampaign={qrLinks[0].utm_campaign}
        />
      )}
    </div>
  );
}
```

---

## Package Installation

```bash
npm install qrcode.react
```

---

## Testing

### Manual Tests

1. **QR Code Display:**
   - Navigate to campaign detail
   - Verify QR codes display
   - Verify location labels show
   - Scan QR with phone to verify it works

2. **Download QR:**
   - Click download button
   - Verify PNG downloads
   - Open image
   - Verify print quality (should be clear)

3. **Copy Short Link:**
   - Click copy button
   - Verify "Copied!" feedback
   - Paste into browser
   - Verify redirect works

4. **UTM Display:**
   - Verify all UTM params show
   - Verify descriptions help understanding
   - Verify formatting is readable

5. **Multiple Locations:**
   - Create campaign with 3 locations
   - Verify 3 QR codes display
   - Verify each has unique short code
   - Verify each links to correct location

---

## Acceptance Criteria

- [ ] QR code component renders
- [ ] QR codes are scannable on phone
- [ ] Download QR button works
- [ ] Downloaded image is high quality
- [ ] Short link displays correctly
- [ ] Copy button works
- [ ] "Copied!" feedback shows
- [ ] External link opens in new tab
- [ ] UTM parameters display
- [ ] Multiple locations show correctly
- [ ] Each QR code is unique
- [ ] Mobile responsive

---

## Estimated Build Time

**4 hours**

## Priority

**Medium** - Nice to have but QR generation happens automatically in background
