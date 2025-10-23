# 🎨 AI-Powered Flyer Generation System - Integration Guide

**Date:** 2025-10-23
**Status:** Implementation In Progress
**Purpose:** Document new AI flyer generation endpoints and integration requirements
**Audience:** Frontend Team Lead

---

## 📊 Overview

The backend now supports AI-powered flyer generation using Flux1.1 (Replicate) for background generation and Sharp for image composition. This system replaces the Puppeteer/HTML workflow with a faster, higher-quality solution.

**Key improvements:**
- ✅ **10x faster** for reused backgrounds (<1s vs 5-10s)
- ✅ **Professional quality** AI-generated backgrounds
- ✅ **Simple** output (PNG instead of PDF)
- ✅ **Tier-gated** premium branding analysis feature

---

## 🗄️ New Database Schema

### Table: `campaign_backgrounds`

Stores AI-generated background images for reuse across campaigns.

```sql
campaign_backgrounds (
  id                  UUID PRIMARY KEY,
  tenant_id           UUID REFERENCES tenants(id),

  -- Image URLs
  image_url           TEXT NOT NULL,
  thumbnail_url       TEXT,

  -- Composition analysis (Sharp-based)
  composition_map     JSONB NOT NULL,
  -- {
  --   "bright_zones": [{"x":1800,"y":800,"width":700,"height":1400}],
  --   "dark_zones": [{"x":0,"y":0,"width":1600,"height":1800}],
  --   "safe_zones": [{"x":1600,"y":200,"width":800,"height":900}]
  -- }

  -- Generation metadata
  flux_prompt         TEXT NOT NULL,
  style_keywords      TEXT[],

  -- User preferences
  is_favorite         BOOLEAN DEFAULT false,

  -- Usage tracking
  times_used          INT DEFAULT 0,
  last_used_at        TIMESTAMPTZ,

  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
)
```

---

### Modified Table: `tenants`

Added branding AI context storage.

```sql
tenants (
  -- ... existing columns ...

  branding_ai_context JSONB DEFAULT '{}'::jsonb
  -- {
  --   "website_url": "https://example.com",
  --   "website_screenshot_url": "https://...",
  --   "instagram_screenshots": ["url1", "url2"],
  --   "product_images": ["url1", "url2", "url3"],
  --   "brand_analysis": {
  --     "color_palette": ["#FF5733", "#3498DB"],
  --     "style_keywords": ["modern", "elegant", "vibrant"],
  --     "industry": "restaurant",
  --     "mood": "warm and inviting"
  --   }
  -- }
)
```

---

### Modified Table: `assets`

Added reference to background used.

```sql
assets (
  -- ... existing columns ...

  background_id UUID REFERENCES campaign_backgrounds(id),
  file_url      TEXT  -- Now points to PNG instead of PDF
)
```

---

## 🔌 API Endpoints

### 1. Capture Branding Moment (Basic - Free Tier)

#### `POST /api/internal/tenants/:tenantId/branding/capture`

**Purpose:** Upload brand assets and analyze with Sharp (free, instant)

**Authentication:** JWT required
**Feature Gate:** `'create_campaigns'` (free tier)

**Request (multipart/form-data):**
```
POST /api/internal/tenants/abc-123/branding/capture
Content-Type: multipart/form-data
Authorization: Bearer <jwt_token>

website_url: https://example.com
instagram_screenshot_1: [file]
instagram_screenshot_2: [file]
product_image_1: [file]
product_image_2: [file]
product_image_3: [file]
```

**Response (200 OK):**
```json
{
  "message": "Branding captured successfully",
  "analysis": {
    "color_palette": ["#FF5733", "#3498DB", "#F4F4F4"],
    "style_keywords": ["modern", "vibrant", "clean"],
    "industry": "restaurant",
    "mood": "Energetic and welcoming",
    "premium_analysis_available": true
  },
  "images_stored": {
    "website_screenshot": "https://storage.../screenshot.png",
    "instagram_screenshots": ["https://...", "https://..."],
    "product_images": ["https://...", "https://..."]
  }
}
```

**Processing:**
- Screenshot website URL (Puppeteer or service)
- Extract logo from DOM (Cheerio parsing)
- Extract color palette (Sharp + k-means clustering)
- Analyze style with heuristics (saturation, brightness, contrast)
- Store all images in Supabase Storage
- Store analysis in `tenants.branding_ai_context`

**Implementation:** Uses Sharp only (no AI) - instant, free

---

### 2. Premium Branding Analysis (Pro Tier)

#### `POST /api/internal/tenants/:tenantId/branding/analyze-premium`

**Purpose:** Enhanced branding analysis using Claude Vision API

**Authentication:** JWT required
**Feature Gate:** `'advanced_analytics'` (Pro tier - tier_level >= 2)
**Middleware:** `preHandler: [verifyJWT, requireFeature('advanced_analytics')]`

**Request:**
```json
{
  "force_reanalysis": false
}
```

**Response (200 OK):**
```json
{
  "message": "Premium analysis completed",
  "analysis": {
    "color_palette": ["#FF5733", "#3498DB", "#F4F4F4", "#2C3E50"],
    "style_keywords": ["modern", "elegant", "vibrant", "sophisticated", "warm"],
    "industry": "fine_dining",
    "mood": "Upscale yet approachable, perfect for discerning diners seeking both quality and comfort",
    "target_audience": "Urban professionals aged 30-55, high disposable income",
    "brand_personality": "Your brand exudes sophistication with a welcoming touch...",
    "premium_analysis": true
  },
  "cost": 0.02
}
```

**Response (403 Forbidden - if not Pro tier):**
```json
{
  "error": "Feature not available in your plan",
  "feature": "Advanced Analytics",
  "requiredPlan": "pro",
  "requiredPlanName": "Pro",
  "currentPlan": "starter",
  "upgradeUrl": "/upgrade?feature=advanced_analytics"
}
```

**Implementation:** Uses Claude Vision API ($0.02 per call, 1-2s latency)

---

### 3. Generate Background

#### `POST /api/internal/tenants/:tenantId/backgrounds/generate`

**Purpose:** Generate new AI background using Flux1.1 + Sharp composition analysis

**Authentication:** JWT required
**Feature Gate:** `'generate_flyers'` (free tier)

**Request:**
```json
{
  "prompt_override": "Optional: Custom Flux prompt instead of auto-generated",
  "style_keywords": ["modern", "vibrant"],
  "generate_count": 1
}
```

**Response (202 Accepted):**
```json
{
  "message": "Background generation started",
  "job_id": "uuid",
  "estimated_time_seconds": 5
}
```

**Processing (async - backgroundWorker.js):**
1. Load `tenants.branding_ai_context`
2. Build Flux prompt from context + overrides
3. Call Replicate Flux1.1 API (~3-5s, $0.01)
4. Download and resize to 2550x3300px (300 DPI)
5. Analyze composition with Sharp (<100ms, free):
   - Grid-based brightness analysis
   - Edge density detection
   - Zone extraction (bright/dark/safe)
6. Upload to Supabase Storage
7. Insert into `campaign_backgrounds` table

**Poll for completion:**
```
GET /api/internal/backgrounds/:backgroundId/status

Response:
{
  "status": "completed|processing|failed",
  "background": {
    "id": "uuid",
    "thumbnail_url": "https://...",
    "image_url": "https://..."
  }
}
```

---

### 4. List Backgrounds

#### `GET /api/internal/tenants/:tenantId/backgrounds`

**Purpose:** Retrieve tenant's background library

**Authentication:** JWT required

**Query Parameters:**
- `favorites_only=true` - Only favorited backgrounds
- `sort=recent|popular|favorites` - Sort order
- `limit=20` - Pagination limit
- `offset=0` - Pagination offset

**Response (200 OK):**
```json
{
  "backgrounds": [
    {
      "id": "uuid",
      "thumbnail_url": "https://...",
      "image_url": "https://...",
      "style_keywords": ["modern", "elegant"],
      "times_used": 5,
      "is_favorite": true,
      "created_at": "2025-10-23T10:00:00Z"
    }
  ],
  "total": 15,
  "limit": 20,
  "offset": 0
}
```

---

### 5. Toggle Background Favorite

#### `PUT /api/internal/backgrounds/:backgroundId/favorite`

**Purpose:** Mark/unmark background as favorite

**Authentication:** JWT required

**Request:**
```json
{
  "is_favorite": true
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "is_favorite": true
}
```

---

### 6. Delete Background

#### `DELETE /api/internal/backgrounds/:backgroundId`

**Purpose:** Remove background from library

**Authentication:** JWT required

**Response (204 No Content)**

---

### 7. Modified: Generate Campaign Flyer

#### `POST /api/internal/campaigns/:campaignId/generate-flyer`

**Purpose:** Generate flyer assets (now uses AI backgrounds + Canvas)

**Authentication:** JWT required
**Feature Gate:** `'generate_flyers'` (free tier)

**Request (MODIFIED):**
```json
{
  "asset_type": "flyer",
  "base_url": "https://example.com/offer",

  // NEW: Background selection
  "background_id": "uuid",
  // OR
  "generate_new_background": true,
  // OR omit both to use default template

  // Existing fields
  "location_ids": ["uuid1", "uuid2"],
  "copy": {
    "headline": "Your Headline",
    "subheadline": "Supporting text",
    "cta": "Call Now!"
  }
}
```

**Response (202 Accepted):**
```json
{
  "message": "Asset generation started",
  "campaign_id": "uuid",
  "assets_created": 5,
  "qr_links_created": 5,
  "jobs_enqueued": 5,
  "background_used": {
    "id": "uuid",
    "thumbnail_url": "https://..."
  },
  "assets": [
    {
      "id": "uuid",
      "name": "Campaign Name - Location Name",
      "file_url": null,
      "background_id": "uuid"
    }
  ]
}
```

**Changed Behavior:**
- If `background_id` provided: Uses cached background (fast - <1s per flyer)
- If `generate_new_background=true`: Generates new background first (5-9s total)
- If neither: Falls back to classic HTML templates (Puppeteer)
- Output: PNG file instead of PDF (stored in `flyers` bucket)

---

### 8. Get Asset Status (Polling)

#### `GET /api/internal/assets/:assetId/status`

**Purpose:** Check if flyer generation is complete

**Authentication:** JWT required

**Response (200 OK):**
```json
{
  "id": "uuid",
  "status": "completed|processing|failed",
  "file_url": "https://storage.../flyer.png",
  "background": {
    "id": "uuid",
    "thumbnail_url": "https://..."
  },
  "created_at": "2025-10-23T10:00:00Z",
  "updated_at": "2025-10-23T10:00:05Z"
}
```

---

## 🎨 Frontend Integration Requirements

### 1. Branding Moment Wizard (New Component)

**Location:** Settings → Brand Assets → Capture Branding

**Flow:**

**Step 1: Upload Assets**
```typescript
interface BrandingCaptureForm {
  websiteUrl: string;
  instagramScreenshots: File[]; // Max 3, optional
  productImages: File[];        // Max 3, optional (required for restaurants)
}
```

- File upload dropzone (drag & drop)
- Website URL input
- Preview uploaded images
- "Analyze Brand" button

**Step 2: Review Analysis**

Call endpoint, display results:
```typescript
const response = await fetch('/api/internal/tenants/:id/branding/capture', {
  method: 'POST',
  body: formData
});

const { analysis } = await response.json();

// Display:
// - Color palette (visual swatches)
// - Style keywords (chips)
// - Industry & mood (text)
```

**Step 3: Upgrade Prompt (If Starter tier)**

```tsx
{analysis.premium_analysis_available && currentPlan !== 'pro' && (
  <Card variant="upgrade">
    <h3>Unlock Premium Brand Analysis</h3>
    <p>Get richer style vocabulary and deeper insights with Claude Vision AI</p>
    <Button onClick={() => navigate('/upgrade?feature=advanced_analytics')}>
      Upgrade to Pro - $99/mo
    </Button>
  </Card>
)}
```

**Step 4: Confirm & Save**

- Allow manual edits to keywords
- "Save Branding" button
- Navigate to Background Library

---

### 2. Background Library (New Page)

**Location:** Settings → Brand Assets → Background Library

**UI Components:**

**Grid View:**
```tsx
<BackgroundGrid>
  {backgrounds.map(bg => (
    <BackgroundCard
      key={bg.id}
      thumbnail={bg.thumbnail_url}
      isFavorite={bg.is_favorite}
      timesUsed={bg.times_used}
      onToggleFavorite={() => toggleFavorite(bg.id)}
      onClick={() => openPreview(bg.id)}
    />
  ))}
</BackgroundGrid>
```

**Actions:**
- "Generate New Background" button (calls `/backgrounds/generate`)
- Sort dropdown (Recent, Most Used, Favorites)
- Filter toggle (Favorites Only)

**Preview Modal:**
- Full-size image display
- Show composition zones overlay (optional debug view)
- "Use in Campaign" button
- "Delete" button
- Favorite toggle

---

### 3. Campaign Wizard - Design Step (Modified)

**Location:** Campaign Creation → Step 4: Choose Design

**Current:** Select from 3 templates (Classic, Modern, Minimal)

**New:** Two tabs

**Tab 1: AI Backgrounds**
```tsx
<BackgroundSelector
  backgrounds={backgrounds}
  selectedId={selectedBackgroundId}
  onSelect={setSelectedBackgroundId}
  onGenerateNew={handleGenerateNew}
/>
```

Features:
- Grid of thumbnails
- "Generate New" button with loading state
- Selected state highlight
- Shows `times_used` badge

**Tab 2: Classic Templates** (Keep for fallback)
- Existing 3 templates remain
- Used if no background selected

**API Call:**
```typescript
const response = await fetch(`/api/internal/campaigns/${campaignId}/generate-flyer`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    asset_type: 'flyer',
    base_url: campaignUrl,
    background_id: selectedBackgroundId, // NEW
    location_ids: selectedLocationIds,
    copy: {
      headline: formData.headline,
      subheadline: formData.subheadline,
      cta: formData.cta
    }
  })
});
```

---

### 4. Flyer Preview & Download (Modified)

**Current:** Display PDF in iframe, "Download PDF" button

**New:** Display PNG image

```tsx
<FlyerPreview>
  <img
    src={asset.file_url}
    alt={asset.name}
    style={{ width: '100%', maxWidth: '850px' }}
  />

  <ActionBar>
    <Button onClick={() => downloadPNG(asset.file_url)}>
      Download PNG
    </Button>

    <Button onClick={() => saveAsPDF(asset.file_url)} variant="secondary">
      Save As PDF
    </Button>

    <Button onClick={() => regenerateWithDifferentBg(asset.id)} variant="ghost">
      Try Different Background
    </Button>
  </ActionBar>
</FlyerPreview>
```

**Download PNG:**
```typescript
async function downloadPNG(fileUrl: string, filename: string) {
  const response = await fetch(fileUrl);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.png`;
  a.click();
  URL.revokeObjectURL(url);
}
```

**Save As PDF (Browser Print):**
```typescript
function saveAsPDF(imageUrl: string) {
  const printWindow = window.open(imageUrl);
  printWindow?.addEventListener('load', () => {
    printWindow.print(); // User selects "Save as PDF" in print dialog
  });
}
```

---

### 5. Polling for Completion

Assets are generated asynchronously. Poll for status:

```typescript
async function pollAssetStatus(assetId: string): Promise<Asset> {
  const maxAttempts = 30; // 30 seconds max
  let attempts = 0;

  while (attempts < maxAttempts) {
    const response = await fetch(`/api/internal/assets/${assetId}/status`);
    const asset = await response.json();

    if (asset.status === 'completed' && asset.file_url) {
      return asset;
    }

    if (asset.status === 'failed') {
      throw new Error('Asset generation failed');
    }

    await sleep(1000); // Poll every 1 second
    attempts++;
  }

  throw new Error('Asset generation timeout');
}
```

**Alternative:** Use WebSocket for real-time updates (if implemented)

---

## 🔒 Feature Gating

### Middleware Usage

All endpoints use the existing feature gating system:

**Free Tier:**
```javascript
// preHandler: [verifyJWT, requireFeature('generate_flyers')]
app.post('/campaigns/:id/generate-flyer', {
  preHandler: [verifyJWT, requireFeature('generate_flyers')]
}, generateFlyerHandler);
```

**Pro Tier:**
```javascript
// preHandler: [verifyJWT, requireFeature('advanced_analytics')]
app.post('/tenants/:id/branding/analyze-premium', {
  preHandler: [verifyJWT, requireFeature('advanced_analytics')]
}, analyzePremiumHandler);
```

### Frontend Feature Check

Before showing premium features, check user's plan:

```typescript
// Fetch user's tenant plan
const { data: tenant } = await fetch('/api/internal/tenants/me');
const { plan_key } = tenant;

// Check feature access
const { data: featureAccess } = await fetch(
  '/api/internal/plans/check-feature?feature=advanced_analytics'
);

if (!featureAccess.hasAccess) {
  // Show upgrade prompt
  showUpgradeModal({
    feature: 'Premium Brand Analysis',
    requiredPlan: 'Pro',
    upgradeUrl: featureAccess.upgradeUrl
  });
}
```

### Plan-Specific UI

```tsx
{currentPlan === 'free' && (
  <Banner variant="upgrade">
    Basic branding analysis available.
    <Link to="/upgrade">Upgrade to Pro for AI-powered insights</Link>
  </Banner>
)}

{currentPlan === 'pro' && (
  <Button onClick={runPremiumAnalysis}>
    Enhance with AI Analysis
  </Button>
)}
```

---

## 📊 Performance Expectations

### Background Generation (First Time)

| Phase | Time | Cost |
|-------|------|------|
| Flux1.1 API call | 3-5s | $0.01 |
| Sharp composition analysis | <100ms | $0 |
| Image upload | 500ms | $0 |
| **Total** | **~5s** | **$0.01** |

### Flyer Composition (Cached Background)

| Phase | Time | Cost |
|-------|------|------|
| Fetch background + QR | 100ms | $0 |
| Canvas composition | 200-500ms | $0 |
| PNG upload | 300ms | $0 |
| **Total** | **<1s** | **$0** |

### Comparison to Current System

| Scenario | Current (Puppeteer) | New (AI Backgrounds) | Improvement |
|----------|---------------------|----------------------|-------------|
| First flyer | 5-10s | 5-6s | Similar |
| Additional flyers (same campaign) | 5-10s each | <1s | **10x faster** |
| Visual quality | Basic HTML | AI professional | **Much better** |

---

## ✅ Testing Checklist

### Backend Testing (Already Complete)

- [x] POST `/branding/capture` - Basic analysis works
- [x] POST `/branding/analyze-premium` - Claude Vision integration
- [x] POST `/backgrounds/generate` - Flux + Sharp pipeline
- [x] GET `/backgrounds` - List with filters
- [x] PUT `/backgrounds/:id/favorite` - Toggle favorite
- [x] DELETE `/backgrounds/:id` - Remove background
- [x] POST `/campaigns/:id/generate-flyer` - Modified endpoint
- [x] GET `/assets/:id/status` - Polling endpoint
- [x] Feature gating middleware - Pro tier check

### Frontend Integration Testing

**Branding Moment:**
- [ ] Upload website URL, screenshots, product images
- [ ] Display basic analysis (colors, keywords)
- [ ] Show upgrade prompt for Pro features
- [ ] Call premium analysis endpoint (Pro users only)
- [ ] Save branding context successfully

**Background Library:**
- [ ] Display grid of generated backgrounds
- [ ] Generate new background (loading state)
- [ ] Poll for completion (show progress)
- [ ] Toggle favorite status
- [ ] Delete background
- [ ] Preview background with zoom
- [ ] Sort and filter backgrounds

**Campaign Wizard:**
- [ ] Select background from library
- [ ] Generate new background inline
- [ ] Fall back to classic templates if no background
- [ ] Pass `background_id` in API call
- [ ] Display loading state during generation

**Flyer Preview:**
- [ ] Display PNG preview (not PDF iframe)
- [ ] Download PNG button works
- [ ] Save as PDF (browser print) works
- [ ] Poll for asset completion
- [ ] Show background thumbnail
- [ ] Regenerate with different background

**Feature Gating:**
- [ ] Free users can use basic branding analysis
- [ ] Premium analysis blocked for Starter users
- [ ] Upgrade modal shown with correct pricing
- [ ] Pro users can access all features

---

## 🚨 Error Handling

### Background Generation Failures

**Replicate API Down:**
```json
{
  "error": "Background generation service unavailable",
  "message": "Replicate API is currently down. Please try again later.",
  "fallback": "classic_templates"
}
```

**Frontend Action:** Automatically fall back to classic templates

**Composition Analysis Fails:**
```json
{
  "error": "Composition analysis failed",
  "message": "Using default safe zones",
  "background_id": "uuid",
  "safe_zones_used": "default"
}
```

**Frontend Action:** Background still usable, text placed in center

---

### Premium Analysis Failures

**Claude API Error:**
```json
{
  "error": "Premium analysis unavailable",
  "message": "AI service temporarily unavailable. Using basic analysis.",
  "refund_issued": false
}
```

**Frontend Action:** Show error toast, don't charge user

---

### Feature Gate Errors

**403 Forbidden:**
```json
{
  "error": "Feature not available in your plan",
  "feature": "Advanced Analytics",
  "requiredPlan": "pro",
  "requiredPlanName": "Pro",
  "currentPlan": "starter",
  "upgradeUrl": "/upgrade?feature=advanced_analytics"
}
```

**Frontend Action:**
1. Show upgrade modal
2. Pre-populate with feature info
3. Link to upgrade flow

---

## 📞 Questions & Support

**Backend Team Lead:** Available for implementation questions

**Key Implementation Files:**
- `/src/plugins/branding/brandingService.js` - Branding capture logic
- `/src/workers/backgroundWorker.js` - Flux + Sharp generation
- `/src/workers/flyerWorker.js` - Canvas-based PNG composition
- `/src/middleware/checkFeatureAccess.js` - Feature gating

**Database Migrations:**
- `20251023_add_campaign_backgrounds_table.sql`
- `20251023_add_tenants_branding_context.sql`
- `20251023_add_assets_background_fk.sql`

**Feature Gates Added:**
- Existing: `'generate_flyers'` (free tier)
- Existing: `'advanced_analytics'` (pro tier)

---

**Document Status:** Ready for Frontend Integration
**Implementation Timeline:** ~1 hour backend (complete), frontend TBD
**Next Steps:** Frontend Team Lead to review and begin integration
