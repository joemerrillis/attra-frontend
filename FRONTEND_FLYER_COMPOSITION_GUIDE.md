# Frontend Flyer Composition & API Integration Guide

**Last Updated:** 2025-01-24
**Purpose:** Comprehensive documentation of how the frontend handles flyer composition, API calls, and layout logic for both onboarding and campaign creation wizards.

---

## Table of Contents

1. [Onboarding Wizard Flow](#onboarding-wizard-flow)
2. [Campaign Creation Wizard (V2) Flow](#campaign-creation-wizard-v2-flow)
3. [Flyer Composition Logic](#flyer-composition-logic)
4. [API Endpoints & Expected Responses](#api-endpoints--expected-responses)
5. [Component Hierarchy](#component-hierarchy)
6. [Layout Positioning Algorithm](#layout-positioning-algorithm)

---

## Onboarding Wizard Flow

**File:** `src/pages/Onboarding.tsx`

### Steps Overview

1. **Step 1: Vertical Selection** - User selects business vertical (dog_walking, restaurants, etc.)
2. **Step 2: Tenant Creation** - User enters business name, uploads logo, selects primary color
3. **Step 3: Brand Moment (Optional)** - User captures brand assets (website URL, Instagram, product images)
4. **Step 4: Location** - User enters first business location
5. **Step 5: Campaign Goal** - User selects campaign goal (stored in localStorage for campaign wizard)

### Step 3: Brand Moment - Brand Asset Capture

**Component:** `src/components/onboarding/BrandMomentForm.tsx`

#### API Call: Brand Asset Capture
```typescript
// Endpoint: POST /api/internal/branding/capture-onboarding
// File: src/lib/branding-api.ts:103-130

await brandingApi.captureOnboarding({
  websiteUrl: string,              // Required
  instagramScreenshots?: File[],   // Optional, max 3
  productImages?: File[]           // Optional, max 3
});
```

**Request Format:** `multipart/form-data`
```
website_url: string
instagram_screenshot_1: File (optional)
instagram_screenshot_2: File (optional)
instagram_screenshot_3: File (optional)
product_image_1: File (optional)
product_image_2: File (optional)
product_image_3: File (optional)
```

**Expected Response:**
```typescript
{
  branding: {
    website_url: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
    };
    fonts: {
      heading: string;
      body: string;
    };
    style_keywords: string[];
  };
  ai_context?: string; // Optional AI-generated brand description
}
```

**What Frontend Does With Response:**
- Stores branding data in tenant record (via backend)
- Does NOT directly use this data for flyer composition
- This is used later for AI background generation prompts

#### API Call: First Background Generation (Auto-triggered)

After brand capture succeeds, if `tenant?.id` exists:

```typescript
// Endpoint: POST /api/internal/tenants/:tenantId/backgrounds/generate
// File: src/lib/backgrounds-api.ts:85-93

await backgroundsApi.generate(tenant.id, {});
```

**Request Body:** `{}`
**Expected Response:**
```typescript
{
  job_id: string;           // Background generation job ID
  status: 'queued' | 'processing';
  estimated_seconds: number; // Usually 5-10 seconds
}
```

**What Frontend Does:**
- Shows "Generating your first AI background..." message
- Does NOT poll for status (relies on Supabase realtime)
- Waits for background to appear via realtime subscription
- Proceeds to next step when complete

---

## Campaign Creation Wizard (V2) Flow

**File:** `src/pages/CampaignWizardV2.tsx`
**State Management:** `src/hooks/useCampaignWizard.ts`

### Steps Overview

1. **Step 1: Name & Goal** - Campaign name and marketing goal
2. **Step 2: Locations** - Select one or more locations (supports inline creation)
3. **Step 3: Asset Type** - Choose flyer/poster/postcard, toggle per-location customization
4. **Step 4: Design** - Two modes:
   - **Shared Mode:** Single design for all locations
   - **Per-Location Mode:** Custom design for each location
5. **Step 5: Preview** - Full-screen preview with ability to edit
6. **Step 6: Review & Generate** - Final review and PDF generation

### Step 4: Design (Shared Mode)

**Component:** `src/components/campaigns/wizard/Step4DesignShared.tsx`

#### User Inputs:
```typescript
{
  destinationUrl: string;          // Where QR code redirects
  copy: {
    headline: string;              // Max 60 chars
    subheadline: string;           // Max 120 chars
    cta: string;                   // Max 40 chars (Call to Action)
  };

  // Either layout OR background_id (mutually exclusive)
  layout?: 'classic' | 'modern' | 'minimal';     // Classic HTML template
  background_id?: string;                         // AI-generated background
}
```

#### Background Selection: Two Tabs

**Tab 1: AI Backgrounds**
- Uses `BackgroundLibrary` component
- Lists all tenant backgrounds via `useBackgrounds` hook
- User can generate new background or select existing
- Generation triggers `POST /api/internal/tenants/:tenantId/backgrounds/generate`

**Tab 2: Classic Templates**
- Radio group of 3 predefined layouts
- No API calls - pure CSS gradients
- See `src/lib/preview-utils.ts:131-148` for styles

### Step 4: Design (Per-Location Mode)

**Component:** `src/components/campaigns/wizard/Step4DesignPerLocation.tsx`

#### Data Structure:
```typescript
locationAssets: Array<{
  location_id: string;
  copy: {
    headline: string;
    subheadline: string;
    cta: string;
  };
  layout?: 'classic' | 'modern' | 'minimal';
  background_id?: string;
}>
```

Each location gets its own tab with:
- Copy fields (headline, subheadline, CTA)
- Background selection (AI vs Classic tabs)
- Independent generation tracking

### Step 5: Preview

**Component:** `src/components/campaigns/wizard/Step5Preview.tsx`

Renders full-screen preview using `FlyerPreviewWithBackground` component.

**No API calls** - all data is already in wizard state.

### Step 6: Review & Generate

**Component:** `src/components/campaigns/wizard/Step6Review.tsx`

Shows summary, then user clicks **"Generate Assets"** button.

#### API Call: Create Campaign

```typescript
// Endpoint: POST /api/internal/campaigns
// File: src/lib/campaign-api.ts

const response = await campaignApi.create({
  name: wizardData.name,
  goal: wizardData.goal,
  status: 'active',
  asset_type: wizardData.assetType,
  destination_url: wizardData.destinationUrl,
});
```

**Expected Response:**
```typescript
{
  campaign: {
    id: string;
    name: string;
    tenant_id: string;
    goal: string;
    status: 'active' | 'draft' | 'completed';
    created_at: string;
  }
}
```

#### API Call: Generate Campaign Assets

**For Shared Mode:**
```typescript
// Endpoint: POST /api/internal/campaigns/:campaignId/assets/generate-batch
// File: src/lib/campaign-api.ts

await campaignApi.generateBatch(campaignId, {
  location_ids: wizardData.selectedLocations,
  shared_copy: {
    headline: wizardData.copy.headline,
    subheadline: wizardData.copy.subheadline,
    cta: wizardData.copy.cta,
  },
  shared_layout: wizardData.layout,           // If using classic template
  shared_background_id: wizardData.background_id, // If using AI background
});
```

**For Per-Location Mode:**
```typescript
// Endpoint: POST /api/internal/campaigns/:campaignId/assets/generate-batch
// File: src/lib/campaign-api.ts

await campaignApi.generateBatch(campaignId, {
  location_assets: wizardData.locationAssets.map(asset => ({
    location_id: asset.location_id,
    headline: asset.copy.headline,
    subheadline: asset.copy.subheadline,
    cta: asset.copy.cta,
    layout: asset.layout,                    // If using classic template
    background_id: asset.background_id,      // If using AI background
  })),
});
```

**Expected Response:**
```typescript
{
  job_id: string;                // Batch generation job ID
  assets: Array<{
    id: string;
    campaign_id: string;
    location_id: string;
    name: string;
    status: 'pending' | 'generating' | 'completed' | 'failed';
    file_url?: string;           // Populated when generation completes
    created_at: string;
  }>;
}
```

**What Frontend Does:**
- Navigates to `/campaigns/:campaignId`
- Shows "Generating PDFs..." message
- Polls asset status or uses realtime subscription
- Shows download buttons when `file_url` populated

---

## Flyer Composition Logic

### Component Hierarchy

```
FlyerPreviewWithBackground (src/components/campaigns/FlyerPreviewWithBackground.tsx)
├── Background Layer
│   ├── AI Background: <img src={background.image_url} />
│   └── Classic Template: <div style={layoutStyles} /> (CSS gradient)
│
└── Content Overlay (absolute positioned)
    ├── Headline Zone
    │   ├── Headline (h1, wrapped if > 30 chars)
    │   └── Subheadline (p)
    │
    └── QR Code + CTA Zone
        ├── QR Code (<img> with white background)
        └── CTA Text (positioned next to QR)
```

### Layout Positioning Algorithm

**File:** `src/lib/preview-utils.ts`

#### Constants
```typescript
const FLYER_WIDTH_PX = 2550;   // 8.5" × 300 DPI
const FLYER_HEIGHT_PX = 3300;  // 11" × 300 DPI
```

All positioning is based on these dimensions and converted to percentages.

#### Headline Positioning

**Function:** `getHeadlineStyle(compositionMap?: CompositionMap)`
**Location:** `src/lib/preview-utils.ts:30-70`

**If AI Background (has compositionMap):**

1. **Find largest safe zone:**
   ```typescript
   const largestZone = compositionMap.safe_zones.reduce((largest, zone) => {
     const area = zone.width * zone.height;
     return area > largestArea ? zone : largest;
   });
   ```

2. **Convert to CSS:**
   ```typescript
   {
     position: 'absolute',
     left: `${(zone.x / 2550) * 100}%`,
     top: `${(zone.y / 3300) * 100}%`,
     width: `${(zone.width / 2550) * 100}%`,
     height: `${(zone.height / 3300) * 100}%`,
   }
   ```

3. **Determine text color:**
   ```typescript
   // Check if headline zone overlaps with bright zones
   const isInBrightZone = compositionMap.bright_zones.some(brightZone =>
     zonesOverlap(largestZone, brightZone)
   );

   color: isInBrightZone ? '#000000' : '#FFFFFF';
   textShadow: isInBrightZone ? 'none' : '2px 2px 4px rgba(0, 0, 0, 0.8)';
   ```

**If Classic Template (no compositionMap):**

```typescript
{
  position: 'absolute',
  top: '15%',
  left: '50%',
  transform: 'translateX(-50%)',
  width: '80%',
  textAlign: 'center',
  color: '#FFFFFF',
  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
}
```

#### QR Code + CTA Positioning

**Function:** `getQRZoneStyle(compositionMap?: CompositionMap)`
**Location:** `src/lib/preview-utils.ts:76-114`

**If AI Background (has compositionMap):**

1. **Find bottom-most safe zone:**
   ```typescript
   const bottomZone = compositionMap.safe_zones.reduce((bottom, zone) => {
     return zone.y > bottom.y ? zone : bottom;
   });
   ```

2. **Convert to CSS with flex layout:**
   ```typescript
   {
     position: 'absolute',
     left: `${(zone.x / 2550) * 100}%`,
     top: `${(zone.y / 3300) * 100}%`,
     width: `${(zone.width / 2550) * 100}%`,
     height: `${(zone.height / 3300) * 100}%`,
     display: 'flex',
     flexDirection: 'column',  // Note: Frontend overrides to 'row'
     alignItems: 'center',
     justifyContent: 'center',
     gap: '1rem',
   }
   ```

3. **Determine text color:**
   ```typescript
   const isInBrightZone = compositionMap.bright_zones.some(brightZone =>
     zonesOverlap(bottomZone, brightZone)
   );

   color: isInBrightZone ? '#000000' : '#FFFFFF';
   textShadow: isInBrightZone ? 'none' : '2px 2px 4px rgba(0, 0, 0, 0.8)';
   ```

**If Classic Template (no compositionMap):**

```typescript
{
  position: 'absolute',
  bottom: '10%',
  left: '50%',
  transform: 'translateX(-50%)',
  width: '60%',
  textAlign: 'center',
  color: '#FFFFFF',
  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
}
```

### Actual Rendering (FlyerPreviewWithBackground.tsx)

**File:** `src/components/campaigns/FlyerPreviewWithBackground.tsx:205-236`

```tsx
{/* QR Code + CTA Zone */}
<div
  style={{
    ...qrZoneStyle,
    // CRITICAL OVERRIDE: Force horizontal layout
    flexDirection: 'row',
  }}
>
  {/* QR Code with White Backing */}
  <div className="bg-white p-4 rounded-lg shadow-2xl flex-shrink-0">
    <img
      src={qrCodeUrl || generatePlaceholderQR()}
      alt="QR Code"
      className="w-32 h-32 md:w-40 md:h-40"  // 128px or 160px
    />
  </div>

  {/* CTA Text */}
  {copy.cta && (
    <div className="flex items-center justify-center flex-1">
      <p
        className="text-2xl md:text-3xl lg:text-4xl font-bold text-center px-4"
        style={{
          color: 'color' in qrZoneStyle ? qrZoneStyle.color : '#FFFFFF',
          textShadow: 'textShadow' in qrZoneStyle ? qrZoneStyle.textShadow : '2px 2px 4px rgba(0, 0, 0, 0.8)',
        }}
      >
        {copy.cta}
      </p>
    </div>
  )}
</div>
```

**Layout Strategy:**
- Parent div gets positioning from `qrZoneStyle` (absolute position within safe zone)
- `flexDirection: 'row'` overrides backend's suggested 'column' to place QR and CTA side-by-side
- QR Code: Fixed size (128-160px), white background, flex-shrink-0 to prevent squishing
- CTA: flex-1 to fill remaining space, centered both horizontally and vertically

### Text Wrapping

**Function:** `wrapText(text: string, maxCharsPerLine: number)`
**Location:** `src/lib/preview-utils.ts:167-186`

Headlines are wrapped at 30 characters per line:

```typescript
const headlineLines = wrapText(copy.headline || 'Your Headline Here', 30);

// Rendered as:
{headlineLines.map((line, i) => (
  <h1 key={i} className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
    {line}
  </h1>
))}
```

---

## API Endpoints & Expected Responses

### Background Generation

#### Generate New Background

**Endpoint:** `POST /api/internal/tenants/:tenantId/backgrounds/generate`
**File:** `src/lib/backgrounds-api.ts:85-93`

**Request:**
```json
{
  "style_prompt": "modern, vibrant, dog walking theme",  // Optional
  "color_palette": ["#FF6B6B", "#4ECDC4"],              // Optional
  "mood": "energetic"                                    // Optional
}
```

**Response:**
```json
{
  "job_id": "bg_1234567890abcdef",
  "status": "queued",
  "estimated_seconds": 8
}
```

#### List Backgrounds

**Endpoint:** `GET /api/internal/tenants/:tenantId/backgrounds`
**File:** `src/lib/backgrounds-api.ts:52-80`

**Query Parameters:**
- `sort`: 'recent' | 'popular' | 'favorites'
- `favorites_only`: boolean
- `limit`: number
- `offset`: number

**Response:**
```json
{
  "backgrounds": [
    {
      "id": "bg_abc123",
      "tenant_id": "tenant_xyz",
      "image_url": "https://storage.example.com/backgrounds/bg_abc123.jpg",
      "thumbnail_url": "https://storage.example.com/backgrounds/bg_abc123_thumb.jpg",
      "composition_map": {
        "safe_zones": [
          {
            "x": 200,
            "y": 100,
            "width": 2150,
            "height": 800,
            "label": "header_zone"
          },
          {
            "x": 300,
            "y": 2400,
            "width": 1950,
            "height": 700,
            "label": "qr_zone"
          }
        ],
        "bright_zones": [
          {
            "x": 0,
            "y": 0,
            "width": 1200,
            "height": 1500,
            "average_brightness": 220
          }
        ],
        "dark_zones": [
          {
            "x": 1200,
            "y": 0,
            "width": 1350,
            "height": 3300,
            "average_brightness": 45
          }
        ]
      },
      "style_keywords": ["modern", "vibrant", "blue", "gradient"],
      "is_favorite": false,
      "usage_count": 5,
      "created_at": "2025-01-24T10:30:00Z"
    }
  ],
  "total": 42,
  "has_more": true
}
```

**Frontend Usage:**
- `useBackgrounds` hook queries this endpoint
- Caches with React Query (queryKey: `['backgrounds', tenantId, sort, favoritesOnly, limit, offset]`)
- Realtime subscription updates cache on INSERT/UPDATE/DELETE

### Campaign Asset Generation

#### Generate Batch (Shared or Per-Location)

**Endpoint:** `POST /api/internal/campaigns/:campaignId/assets/generate-batch`
**File:** `src/lib/campaign-api.ts`

**Request (Shared Mode):**
```json
{
  "location_ids": ["loc_123", "loc_456", "loc_789"],
  "shared_copy": {
    "headline": "Free Walk Guarantee",
    "subheadline": "We respond in 3 hours or your walk is free",
    "cta": "Scan to Learn More"
  },
  "shared_layout": "modern",
  "shared_background_id": null
}
```

**Request (Per-Location Mode):**
```json
{
  "location_assets": [
    {
      "location_id": "loc_123",
      "headline": "Free Walk in Brooklyn",
      "subheadline": "We respond in 3 hours",
      "cta": "Scan Now",
      "layout": null,
      "background_id": "bg_abc123"
    },
    {
      "location_id": "loc_456",
      "headline": "Free Walk in Manhattan",
      "subheadline": "Same day service",
      "cta": "Get Started",
      "layout": "minimal",
      "background_id": null
    }
  ]
}
```

**Response:**
```json
{
  "job_id": "batch_xyz789",
  "assets": [
    {
      "id": "asset_001",
      "campaign_id": "camp_abc",
      "location_id": "loc_123",
      "name": "Free Walk Guarantee - Brooklyn",
      "status": "generating",
      "qr_code_url": "https://app.example.com/s/qr_abc123",
      "created_at": "2025-01-24T10:35:00Z"
    },
    {
      "id": "asset_002",
      "campaign_id": "camp_abc",
      "location_id": "loc_456",
      "name": "Free Walk Guarantee - Manhattan",
      "status": "generating",
      "qr_code_url": "https://app.example.com/s/qr_def456",
      "created_at": "2025-01-24T10:35:00Z"
    }
  ]
}
```

**Frontend Polling:**

After receiving initial response, frontend polls for updates:

**Endpoint:** `GET /api/internal/campaigns/:campaignId/assets`
**Query:** `?status=generating`

When `status` changes to `'completed'` and `file_url` is populated:
```json
{
  "assets": [
    {
      "id": "asset_001",
      "status": "completed",
      "file_url": "https://storage.example.com/pdfs/asset_001.pdf",
      "generated_at": "2025-01-24T10:35:08Z"
    }
  ]
}
```

---

## Component Hierarchy

### Onboarding Flow

```
Onboarding.tsx (Page)
└── Step 3: BrandMomentForm.tsx
    ├── Calls: brandingApi.captureOnboarding()
    └── Calls: backgroundsApi.generate()
```

### Campaign Wizard Flow

```
CampaignWizardV2.tsx (Page)
├── useCampaignWizard() (State Hook)
│
├── Step 1: Step1NameGoal.tsx
├── Step 2: Step2Locations.tsx
├── Step 3: Step3AssetType.tsx
│
├── Step 4: [Conditional Rendering]
│   ├── Step4DesignShared.tsx (if !customizePerLocation)
│   │   ├── BackgroundLibrary.tsx
│   │   │   ├── useBackgrounds() → GET /backgrounds
│   │   │   └── BackgroundCard.tsx (multiple)
│   │   └── useBackgroundGeneration() → POST /backgrounds/generate
│   │
│   └── Step4DesignPerLocation.tsx (if customizePerLocation)
│       └── [For each location]
│           └── BackgroundLibrary.tsx (compact mode)
│
├── Step 5: Step5Preview.tsx
│   └── FlyerPreviewWithBackground.tsx
│       ├── Background Layer (image or gradient)
│       └── Content Overlay
│           ├── Headline Zone
│           └── QR Code + CTA Zone
│
└── Step 6: Step6Review.tsx
    ├── Calls: campaignApi.create()
    └── Calls: campaignApi.generateBatch()
```

### Preview Components

```
FlyerPreviewWithBackground.tsx
├── Uses: getHeadlineStyle() from preview-utils.ts
├── Uses: getQRZoneStyle() from preview-utils.ts
├── Uses: getLayoutStyles() from preview-utils.ts
├── Uses: wrapText() from preview-utils.ts
└── Uses: generatePlaceholderQR() from preview-utils.ts
```

---

## Critical Frontend Behaviors

### 1. Background Realtime Updates

**File:** `src/hooks/useBackgrounds.ts:68-152`

When component mounts, subscribes to Supabase realtime:

```typescript
const channel = supabase
  .channel('backgrounds-realtime')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'campaign_backgrounds',
    filter: `tenant_id=eq.${tenantId}`,
  }, (payload) => {
    // Optimistically update React Query cache
    queryClient.setQueryData(['backgrounds', tenantId, ...], (oldData) => ({
      ...oldData,
      backgrounds: [payload.new, ...oldData.backgrounds],
    }));
  })
  .subscribe();
```

**Result:** New backgrounds appear instantly without polling.

### 2. Generation State Management

**File:** `src/hooks/useBackgroundGeneration.ts`

```typescript
const { generate, isGenerating } = useBackgroundGeneration({
  tenantId: tenant?.id || '',
  onSuccess: (background) => {
    // Background appeared via realtime, this callback confirms it
    onBackgroundIdChange(background.id);
  },
});
```

- `isGenerating` is `true` from mutation start until realtime receives background
- Used to disable "Generate" button and show loading state

### 3. Layout vs Background Mutual Exclusivity

**File:** `src/hooks/useCampaignWizard.ts:28-48`

Validation logic ensures either `layout` OR `background_id`, never both:

```typescript
case 4: // Design
  if (!wizardData.customizePerLocation) {
    return !!(
      wizardData.destinationUrl &&
      wizardData.copy?.headline &&
      wizardData.copy?.subheadline &&
      wizardData.copy?.cta &&
      (wizardData.layout || wizardData.background_id)  // Either/or
    );
  }
```

When switching from AI to Classic templates:
```typescript
// Step4DesignShared.tsx:85-92
if (mode === 'classic') {
  onBackgroundIdChange(undefined);  // Clear background
  if (!layout) {
    onLayoutChange('modern');        // Set default layout
  }
}
```

### 4. QR Code Placeholder

**File:** `src/lib/preview-utils.ts:191-205`

In preview mode (before PDF generation), QR code doesn't exist yet:

```tsx
<img
  src={qrCodeUrl || generatePlaceholderQR()}
  alt="QR Code"
/>
```

`generatePlaceholderQR()` returns a data URI SVG that looks like a QR code.

Real QR codes only exist after calling `POST /campaigns/:id/assets/generate-batch`.

---

## Expected Backend Behavior

Based on frontend implementation, the backend should:

### For AI Backgrounds

1. **Analyze composition_map** to find safe zones
2. **Position headline** in largest safe zone
3. **Position QR + CTA** in bottom-most safe zone
4. **Determine text color** based on bright/dark zone overlap
5. **Layout QR and CTA horizontally** (side-by-side) within the zone
6. **QR Code size:** Approximately 128-160px (same as frontend preview)
7. **Apply text shadows** when text is on dark backgrounds

### For Classic Templates

1. **Apply CSS gradient** matching frontend styles (see `getLayoutStyles()`)
2. **Position headline** at 15% from top, centered, 80% width
3. **Position QR + CTA** at 10% from bottom, centered, 60% width
4. **Use white text** with black text-shadow for all text
5. **Layout QR and CTA horizontally**

### Text Sizing

- **Headline:** `text-4xl md:text-5xl lg:text-6xl` (approx 36px, 48px, 60px)
- **Subheadline:** `text-xl md:text-2xl` (approx 20px, 24px)
- **CTA:** `text-2xl md:text-3xl lg:text-4xl` (approx 24px, 30px, 36px)

### Important: Responsive Sizing

Frontend uses Tailwind responsive prefixes (`md:`, `lg:`), but PDFs are fixed-size (8.5" × 11").

**Backend should use the largest size:**
- Headline: 60px
- Subheadline: 24px
- CTA: 36px

---

## Debugging & Validation

### Safe Zone Overlay

Frontend includes debug mode to visualize zones:

**File:** `src/components/campaigns/FlyerPreviewWithBackground.tsx:233-291`

```tsx
{showZones && background?.composition_map && (
  <svg className="absolute inset-0 w-full h-full pointer-events-none">
    {/* Green = Safe zones */}
    {/* Yellow = Bright zones */}
    {/* Blue = Dark zones */}
  </svg>
)}
```

Enable by clicking "Show Zones" button in preview.

### Console Logging

Key debug points:

1. **Campaign creation:** `src/components/campaigns/PDFPreview.tsx:39-78`
2. **Background generation:** `src/components/campaigns/wizard/Step4DesignShared.tsx:62-69`
3. **Asset generation:** Campaign wizard Step 6

---

## Known Issues & Workarounds

### Issue 1: Text Overlap in QR Zone

**Symptom:** CTA text overlaps/stacks vertically
**Root Cause:** Conflicting `flexDirection` between backend composition_map and frontend override
**Status:** Fixed in frontend (commit 0a78b6c)
**Backend Note:** Should render QR and CTA horizontally, not vertically

### Issue 2: Previously Generated PDFs Not Fixed

**Symptom:** Old PDFs still have overlapping text
**Explanation:** PDFs are static files generated at creation time
**Solution:** Regenerate PDFs with "Regenerate PDF" button or create new campaign

---

## Summary for Backend Team

### What Frontend Sends to Backend

**For AI Background PDFs:**
```json
{
  "background_id": "bg_abc123",
  "headline": "Free Walk Guarantee",
  "subheadline": "We respond in 3 hours or your walk is free",
  "cta": "Scan to Learn More",
  "qr_code_url": "https://app.example.com/s/qr_123"
}
```

**For Classic Template PDFs:**
```json
{
  "layout": "modern",
  "headline": "Free Walk Guarantee",
  "subheadline": "We respond in 3 hours or your walk is free",
  "cta": "Scan to Learn More",
  "qr_code_url": "https://app.example.com/s/qr_123"
}
```

### What Backend Should Do

1. **Fetch background** (if `background_id` provided) including `composition_map`
2. **OR apply template styles** (if `layout` provided)
3. **Position headline** using largest safe zone or centered at 15% from top
4. **Position QR + CTA** using bottom safe zone or centered at 10% from bottom
5. **Layout QR and CTA side-by-side** (horizontally)
6. **Set text colors** based on bright/dark zones (black on bright, white on dark)
7. **Apply text shadows** (only on dark backgrounds)
8. **Generate 8.5" × 11" PDF** at 300 DPI (2550 × 3300 pixels)
9. **Upload to storage** and return `file_url`

### Coordinate System

All zones in `composition_map` use **absolute pixel coordinates**:
- Width: 2550px (8.5" × 300 DPI)
- Height: 3300px (11" × 300 DPI)

Convert to percentages:
```
left%   = (zone.x / 2550) * 100
top%    = (zone.y / 3300) * 100
width%  = (zone.width / 2550) * 100
height% = (zone.height / 3300) * 100
```

---

**End of Document**
