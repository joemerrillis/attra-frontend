# 🎨 AI-Powered Flyer Generation System - Technical Proposal

**Date:** 2025-10-23
**Status:** Research & Feasibility Analysis
**Purpose:** Replace Puppeteer/HTML workflow with AI-generated backgrounds + intelligent composition
**Audience:** Frontend Team Lead, Backend Team Lead
**Decision Required:** Approve for implementation or request modifications

---

## 📊 Executive Summary

### Current System Problems
- ❌ **Slow:** 5-10 second wait per flyer (Puppeteer cold start)
- ❌ **Basic quality:** Three simple HTML templates, not visually compelling
- ❌ **Complex deployment:** Requires Chrome/Puppeteer in worker (large Docker image)
- ❌ **Not scalable:** Each flyer regenerates from scratch

### Proposed Solution
- ✅ **Fast:** <1 second for cached backgrounds (10x faster after first generation)
- ✅ **Professional quality:** AI-generated backgrounds with intelligent text placement
- ✅ **Simpler deployment:** No Chrome dependency, just Node.js + Sharp
- ✅ **Scalable:** Background library with reusability across campaigns
- ✅ **Similar initial cost:** 6-9 seconds for first flyer, then near-instant for subsequent

### Key Innovation
Replace "HTML → Puppeteer → PDF" with "AI Background → Composition Analysis → Canvas Overlay → PNG"

---

## 🏗️ Proposed Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 1: BRANDING MOMENT (One-time per tenant)                 │
└─────────────────────────────────────────────────────────────────┘
    User uploads:
    ├─ Website URL (for screenshot)
    ├─ Instagram screenshots (2-3 images)
    └─ Product/menu photos (if restaurant: 3 plated dishes)
                        ↓
    AI Analysis (Claude/GPT-4V):
    ├─ Extract color palette
    ├─ Identify style keywords (modern, elegant, vibrant, minimal)
    ├─ Detect industry/vertical
    └─ Generate brand personality description
                        ↓
    Store in tenants.branding_ai_context (JSONB)

┌─────────────────────────────────────────────────────────────────┐
│ PHASE 2: BACKGROUND GENERATION (First time or on-demand)       │
└─────────────────────────────────────────────────────────────────┘
    Input: branding_ai_context
                        ↓
    Generate Flux1.1 Prompt:
    "Professional [industry] marketing background, [style keywords],
     [color palette], subject [position], text-safe zones, high contrast"
                        ↓
    Call Replicate API (Flux1.1-Pro):
    ├─ aspect_ratio: "portrait" (8.5:11 ratio)
    ├─ output_format: "png"
    ├─ output_quality: 95
    └─ Time: ~3-5 seconds
                        ↓
    Upload to Supabase Storage (backgrounds bucket)
                        ↓
    Composition Analysis (CLIP-Seg or SAM2):
    ├─ Detect bright_zones (for dark text)
    ├─ Detect dark_zones (for light text)
    ├─ Identify subject_region (avoid text overlap)
    ├─ Calculate safe_zones (optimal text placement)
    └─ Time: ~2-3 seconds
                        ↓
    Output: composition_map JSON
    {
      "bright_zones": [{"x":1800,"y":800,"width":700,"height":1400}],
      "dark_zones": [{"x":0,"y":0,"width":1600,"height":1800}],
      "subject_region": {"x":200,"y":900,"width":900,"height":1200},
      "safe_zones": [{"x":1600,"y":200,"width":800,"height":900}]
    }
                        ↓
    Store in campaign_backgrounds table (reusable library)

┌─────────────────────────────────────────────────────────────────┐
│ PHASE 3: FLYER COMPOSITION (Per asset, uses cached background) │
└─────────────────────────────────────────────────────────────────┘
    Input:
    ├─ background_id (from library)
    ├─ campaign copy (headline, subheadline, cta)
    ├─ qr_code_url (pre-generated)
    └─ location data
                        ↓
    Load background + composition_map from database (~50ms)
                        ↓
    Canvas Composition (Sharp + node-canvas):
    ├─ Create 2550x3300px canvas (300 DPI for print quality)
    ├─ Draw background image
    ├─ Select optimal text zones from composition_map
    ├─ Auto-select text color (dark on bright, light on dark)
    ├─ Render headline with word wrapping
    ├─ Render subheadline and CTA
    ├─ Place QR code in safe zone with white backing
    └─ Time: ~200-500ms
                        ↓
    Export as PNG buffer
                        ↓
    Upload to Supabase Storage (flyers bucket)
                        ↓
    Update asset.file_url
                        ↓
    Frontend: User can "Save As PDF" or download PNG directly
```

---

## 🗄️ Database Schema Changes

### New Table: `campaign_backgrounds`

```sql
CREATE TABLE public.campaign_backgrounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

  -- Generated image
  image_url TEXT NOT NULL,
  thumbnail_url TEXT, -- 400x600px preview

  -- Composition analysis result
  composition_map JSONB NOT NULL,
  -- Structure:
  -- {
  --   "bright_zones": [{x, y, width, height}, ...],
  --   "dark_zones": [{x, y, width, height}, ...],
  --   "subject_region": {x, y, width, height},
  --   "safe_zones": [{x, y, width, height}, ...]
  -- }

  -- Generation metadata
  flux_prompt TEXT NOT NULL,
  style_keywords TEXT[], -- ["modern", "elegant"]
  generation_params JSONB, -- Store full Flux params for reproducibility

  -- User customization (optional)
  user_adjusted_zones JSONB, -- Allow manual zone override
  is_favorite BOOLEAN DEFAULT false,

  -- Usage tracking
  times_used INT DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_backgrounds_tenant ON campaign_backgrounds(tenant_id);
CREATE INDEX idx_backgrounds_favorites ON campaign_backgrounds(tenant_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX idx_backgrounds_usage ON campaign_backgrounds(tenant_id, times_used DESC);
```

### Modify Table: `tenants`

```sql
-- Add AI branding context storage
ALTER TABLE public.tenants
  ADD COLUMN branding_ai_context JSONB DEFAULT '{}'::jsonb;

-- Structure:
-- {
--   "website_url": "https://example.com",
--   "website_screenshot_url": "https://...",
--   "instagram_screenshots": ["url1", "url2"],
--   "product_images": ["url1", "url2", "url3"],
--   "brand_analysis": {
--     "color_palette": ["#FF5733", "#3498DB"],
--     "style_keywords": ["modern", "elegant", "vibrant"],
--     "industry": "restaurant",
--     "vertical": "fine_dining",
--     "mood": "warm and inviting",
--     "target_audience": "upscale diners aged 30-55",
--     "brand_personality": "Sophisticated yet approachable..."
--   }
-- }
```

### Modify Table: `assets`

```sql
-- Add reference to background used (optional FK)
ALTER TABLE public.assets
  ADD COLUMN background_id UUID REFERENCES public.campaign_backgrounds(id) ON DELETE SET NULL;

CREATE INDEX idx_assets_background ON assets(background_id);

-- Existing metadata field will store composition overrides:
-- assets.metadata = {
--   "layout": "custom_ai",
--   "copy": {...},
--   "text_placement": {
--     "headline_zone": {"x":..., "y":..., "width":..., "height":...},
--     "qr_zone": {...}
--   }
-- }
```

---

## 🔌 New API Endpoints

### 1. Branding Moment Capture

#### `POST /api/internal/tenants/:tenantId/branding-moment`

**Purpose:** Upload brand assets and trigger AI analysis

**Request (multipart/form-data):**
```
POST /api/internal/tenants/abc-123/branding-moment
Content-Type: multipart/form-data

website_url: https://example.com
instagram_screenshot_1: [file]
instagram_screenshot_2: [file]
product_image_1: [file]
product_image_2: [file]
product_image_3: [file]
```

**Response:**
```json
{
  "message": "Branding analysis started",
  "job_id": "uuid",
  "status": "processing"
}
```

**Processing (async):**
1. Upload all images to Supabase Storage
2. Take screenshot of website_url
3. Call Claude/GPT-4V API with all images
4. Extract brand analysis
5. Update `tenants.branding_ai_context`

**Completion polling:** `GET /api/internal/tenants/:id/branding-status`

---

### 2. Background Generation

#### `POST /api/internal/tenants/:tenantId/backgrounds/generate`

**Purpose:** Generate new AI background for tenant's library

**Request:**
```json
{
  "prompt_override": "Optional custom prompt instead of auto-generated",
  "style_keywords": ["modern", "vibrant"], // Optional override
  "auto_generate_count": 3 // Generate multiple variations
}
```

**Response:**
```json
{
  "message": "Background generation started",
  "job_ids": ["uuid1", "uuid2", "uuid3"],
  "estimated_time_seconds": 25
}
```

**Processing (async - backgroundWorker.js):**
1. Load `tenants.branding_ai_context`
2. Build Flux prompt from context + overrides
3. Call Replicate Flux1.1 API
4. Upload generated image to Storage
5. Call CLIP-Seg/SAM2 for composition analysis
6. Store in `campaign_backgrounds` table

---

### 3. List Backgrounds

#### `GET /api/internal/tenants/:tenantId/backgrounds`

**Purpose:** Retrieve tenant's background library

**Query Params:**
- `favorites_only=true` - Only show favorited backgrounds
- `sort=recent|popular|favorites` - Sort order
- `limit=20` - Pagination limit

**Response:**
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
    },
    ...
  ],
  "total": 15
}
```

---

### 4. Modified: Generate Campaign Flyer

#### `POST /api/internal/campaigns/:campaignId/generate-flyer`

**NEW Request Structure:**
```json
{
  "asset_type": "flyer",
  "base_url": "https://example.com/offer",

  // NEW: Background selection
  "background_id": "uuid", // Select from library
  // OR
  "generate_new_background": true, // Auto-generate new one

  // Existing fields
  "location_ids": ["uuid1", "uuid2"],
  "copy": {
    "headline": "Your Headline",
    "subheadline": "Supporting text",
    "cta": "Call Now!"
  }
}
```

**Response (unchanged):**
```json
{
  "message": "Asset generation started",
  "campaign_id": "...",
  "assets_created": 5,
  "qr_links_created": 5,
  "jobs_enqueued": 5,
  "background_used": {
    "id": "uuid",
    "thumbnail_url": "https://..."
  }
}
```

**Processing Changes:**
- If `background_id` provided: Use cached background (fast path)
- If `generate_new_background=true`: Queue background generation first (slow path)
- Worker uses Canvas to compose PNG instead of Puppeteer

---

### 5. Background Favorites

#### `PUT /api/internal/backgrounds/:backgroundId/favorite`

**Request:**
```json
{
  "is_favorite": true
}
```

**Response:**
```json
{
  "id": "uuid",
  "is_favorite": true
}
```

---

### 6. Manual Zone Adjustment

#### `PUT /api/internal/backgrounds/:backgroundId/zones`

**Purpose:** Allow user to manually adjust composition zones if AI gets it wrong

**Request:**
```json
{
  "composition_map": {
    "bright_zones": [...],
    "dark_zones": [...],
    "subject_region": {...},
    "safe_zones": [...]
  }
}
```

**Response:**
```json
{
  "id": "uuid",
  "composition_map": {...}
}
```

---

## 🖼️ Frontend Integration Points

### New UI Components Needed

#### 1. **Branding Moment Wizard** (One-time Setup)

**Location:** Settings → Branding → AI Analysis

**Steps:**
1. **Welcome Screen**
   - "Let's capture your brand identity"
   - Show benefits: Better flyers, automatic design

2. **Upload Assets**
   ```typescript
   interface BrandingMomentForm {
     websiteUrl: string;
     instagramScreenshots: File[]; // Max 3
     productImages: File[]; // Max 3
   }
   ```
   - Drag-and-drop file upload
   - Website URL input with auto-screenshot
   - Preview uploaded images

3. **Processing Screen**
   - Show progress: "Analyzing your brand..."
   - Loading states for each step

4. **Review & Confirm**
   - Display extracted brand analysis:
     - Color palette (show swatches)
     - Style keywords (chips)
     - Brand personality (text)
   - Allow edits before saving

**API Calls:**
```typescript
// Submit
POST /api/internal/tenants/:id/branding-moment
→ Returns job_id

// Poll for completion
GET /api/internal/tenants/:id/branding-status
→ Returns { status: 'completed', branding_ai_context: {...} }
```

---

#### 2. **Background Library** (New Page)

**Location:** Settings → Brand Assets → Background Library

**Features:**
- Grid view of generated backgrounds (thumbnails)
- "Generate New" button (triggers background generation)
- Favorite/unfavorite backgrounds (star icon)
- Delete backgrounds (trash icon)
- Sort by: Recent, Most Used, Favorites
- Click to preview full-size with composition zones overlay

**API Calls:**
```typescript
// List backgrounds
GET /api/internal/tenants/:id/backgrounds?favorites_only=false&sort=recent
→ Returns { backgrounds: [...] }

// Generate new
POST /api/internal/tenants/:id/backgrounds/generate
→ Returns { job_ids: [...] }

// Toggle favorite
PUT /api/internal/backgrounds/:id/favorite
→ Returns { is_favorite: true }
```

---

#### 3. **Background Selector in Campaign Wizard** (Modified)

**Location:** Campaign Creation → Step 4: Choose Design

**Current:** Select from 3 templates (Classic, Modern, Minimal)

**New:** Select from background library OR templates

```typescript
interface DesignSelection {
  mode: 'ai_background' | 'classic_template';

  // If ai_background:
  background_id?: string;
  generate_new?: boolean;

  // If classic_template:
  template?: 'classic' | 'modern' | 'minimal';
}
```

**UI:**
- Tab 1: "AI Backgrounds" (show library thumbnails)
- Tab 2: "Classic Templates" (show 3 existing templates)
- "Generate New Background" button in Tab 1

**API Call (unchanged endpoint, new params):**
```typescript
POST /api/internal/campaigns/:id/generate-flyer
{
  background_id: 'uuid', // NEW
  // OR
  generate_new_background: true, // NEW
  // ... existing params
}
```

---

#### 4. **Flyer Preview & Download** (Modified)

**Current:** Display PDF in iframe, download button

**New:** Display PNG image, "Save As PDF" button

```typescript
interface Asset {
  id: string;
  file_url: string; // Now points to PNG instead of PDF
  background_id: string; // NEW - reference to background used
  // ... existing fields
}
```

**UI Changes:**
- Show PNG preview with zoom controls
- "Download PNG" button (direct download)
- "Save As PDF" button (browser print dialog with "Save as PDF")
- "Regenerate" button (if user wants different background)

**Download Flow:**
```typescript
// PNG download
async function downloadPNG(asset: Asset) {
  const response = await fetch(asset.file_url);
  const blob = await response.blob();
  saveAs(blob, `${asset.name}.png`);
}

// PDF conversion (browser-based)
async function saveAsPDF(asset: Asset) {
  const printWindow = window.open(asset.file_url);
  printWindow?.addEventListener('load', () => {
    printWindow.print(); // User selects "Save as PDF"
  });
}
```

---

## ⚙️ Backend Implementation Details

### New Worker: `backgroundWorker.js`

**Purpose:** Generate AI backgrounds asynchronously

**File Location:** `/src/workers/backgroundWorker.js`

**Dependencies:**
```json
{
  "replicate": "^0.25.0",
  "sharp": "^0.33.0"
}
```

**Main Function:**
```javascript
async function generateBackground(jobData) {
  const { tenantId, promptOverride, styleKeywords } = jobData;

  // 1. Load branding context
  const { data: tenant } = await supabase
    .from('tenants')
    .select('branding_ai_context')
    .eq('id', tenantId)
    .single();

  const context = tenant.branding_ai_context;

  // 2. Build Flux prompt
  const prompt = promptOverride || buildFluxPrompt(context, styleKeywords);

  // 3. Call Replicate Flux1.1 API
  const fluxResponse = await replicate.run(
    "black-forest-labs/flux-1.1-pro",
    {
      input: {
        prompt,
        aspect_ratio: "9:16", // Portrait (closest to 8.5:11)
        output_format: "png",
        output_quality: 95,
        safety_tolerance: 2
      }
    }
  );

  // 4. Download image
  const imageBuffer = await fetch(fluxResponse.output[0]).then(r => r.buffer());

  // 5. Resize to exact dimensions (2550x3300px for 300 DPI)
  const resizedBuffer = await sharp(imageBuffer)
    .resize(2550, 3300, { fit: 'cover' })
    .png({ quality: 95 })
    .toBuffer();

  // 6. Upload to Supabase Storage
  const fileName = `${uuidv4()}.png`;
  const { url: imageUrl } = await uploadFile(
    'backgrounds',
    tenantId,
    resizedBuffer,
    fileName
  );

  // 7. Generate thumbnail
  const thumbnailBuffer = await sharp(resizedBuffer)
    .resize(400, 600, { fit: 'cover' })
    .png()
    .toBuffer();

  const { url: thumbnailUrl } = await uploadFile(
    'backgrounds',
    tenantId,
    thumbnailBuffer,
    `thumb_${fileName}`
  );

  // 8. Analyze composition
  const compositionMap = await analyzeComposition(imageUrl);

  // 9. Store in database
  const { data: background } = await supabase
    .from('campaign_backgrounds')
    .insert({
      tenant_id: tenantId,
      image_url: imageUrl,
      thumbnail_url: thumbnailUrl,
      composition_map: compositionMap,
      flux_prompt: prompt,
      style_keywords: styleKeywords || context.brand_analysis.style_keywords,
      generation_params: { aspect_ratio: "9:16", output_quality: 95 }
    })
    .select()
    .single();

  return background;
}
```

**Composition Analysis:**
```javascript
async function analyzeComposition(imageUrl) {
  // Option A: Use CLIP-Seg for semantic segmentation
  const clipSegResponse = await replicate.run(
    "cjwbw/clipseg:ea201c956e25502077f5c80924e8d41b0e6da7d602f5ab2ab01741e7f4dcc9bd",
    {
      input: {
        image: imageUrl,
        prompts: "bright area, dark area, person, object, empty space"
      }
    }
  );

  // Process masks to bounding boxes
  const masks = await Promise.all(
    clipSegResponse.map(async (maskUrl) => {
      const maskBuffer = await fetch(maskUrl).then(r => r.buffer());
      return await sharp(maskBuffer).raw().toBuffer({ resolveWithObject: true });
    })
  );

  // Convert masks to zones
  const brightZones = extractZonesFromMask(masks[0]); // "bright area" mask
  const darkZones = extractZonesFromMask(masks[1]);   // "dark area" mask
  const subjectRegion = extractLargestZone(masks[2]); // "person/object" mask

  // Calculate safe zones (areas not overlapping subject)
  const safeZones = calculateSafeZones(brightZones, darkZones, subjectRegion);

  return {
    bright_zones: brightZones,
    dark_zones: darkZones,
    subject_region: subjectRegion,
    safe_zones: safeZones
  };
}

function extractZonesFromMask(maskData, threshold = 0.5) {
  const { data, info } = maskData;
  const { width, height } = info;

  // Find contiguous regions above threshold
  const zones = [];
  const visited = new Set();

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (visited.has(idx)) continue;

      const value = data[idx] / 255; // Normalize to 0-1
      if (value > threshold) {
        // Flood fill to find zone bounds
        const zone = floodFill(data, width, height, x, y, threshold, visited);
        if (zone.width > 200 && zone.height > 200) { // Min size filter
          zones.push(zone);
        }
      }
    }
  }

  return zones;
}
```

---

### Modified Worker: `pdfWorker.js` → `flyerWorker.js`

**Purpose:** Compose PNG flyers (replaces PDF generation)

**Key Changes:**
```javascript
// OLD: generatePDF() with Puppeteer
async function generatePDF(jobData) {
  const browser = await puppeteer.launch(...); // 3-4 seconds
  // ... HTML rendering
}

// NEW: composeFlyerPNG() with Canvas
async function composeFlyerPNG(jobData) {
  const {
    campaignId,
    assetId,
    locationId,
    backgroundId, // NEW: reference to background
    copy,
    branding
  } = jobData;

  // 1. Fetch background and composition map
  const { data: background } = await supabase
    .from('campaign_backgrounds')
    .select('image_url, composition_map')
    .eq('id', backgroundId)
    .single();

  // 2. Fetch QR code
  const { data: qrLink } = await supabase
    .from('qr_links')
    .select('qr_code_url')
    .eq('asset_id', assetId)
    .single();

  // 3. Create canvas
  const { createCanvas, loadImage, registerFont } = require('canvas');

  registerFont('./fonts/Inter-Bold.ttf', { family: 'Inter', weight: 'bold' });
  registerFont('./fonts/Inter-Regular.ttf', { family: 'Inter' });

  const width = 2550;  // 8.5" * 300 DPI
  const height = 3300; // 11" * 300 DPI
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // 4. Draw background
  const bgImage = await loadImage(background.image_url);
  ctx.drawImage(bgImage, 0, 0, width, height);

  // 5. Select zones from composition map
  const { safe_zones, bright_zones } = background.composition_map;

  // Pick largest safe zone for headline
  const headlineZone = safe_zones.sort((a, b) =>
    (b.width * b.height) - (a.width * a.height)
  )[0];

  // 6. Draw headline
  const textColor = isZoneBright(headlineZone, bright_zones) ? '#000000' : '#FFFFFF';
  ctx.font = 'bold 120px Inter';
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';

  const lines = wrapText(ctx, copy.headline, headlineZone.width - 100);
  lines.forEach((line, i) => {
    ctx.fillText(
      line,
      headlineZone.x + headlineZone.width / 2,
      headlineZone.y + 150 + (i * 140)
    );
  });

  // 7. Draw QR code in safe zone
  const qrZone = safe_zones[1] || {
    x: width - 800,
    y: height - 800,
    width: 700,
    height: 700
  };

  // Add white background for scannability
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(
    qrZone.x - 50,
    qrZone.y - 50,
    qrZone.width + 100,
    qrZone.height + 100
  );

  const qrImage = await loadImage(qrLink.qr_code_url);
  ctx.drawImage(qrImage, qrZone.x, qrZone.y, qrZone.width, qrZone.height);

  // 8. Export PNG
  const pngBuffer = canvas.toBuffer('image/png', { compressionLevel: 9 });

  // 9. Upload to Storage
  const fileName = `${assetId}.png`;
  const { url } = await uploadFile('flyers', tenantId, pngBuffer, fileName);

  // 10. Update asset
  await supabase
    .from('assets')
    .update({
      file_url: url,
      background_id: backgroundId, // NEW: track background used
      updated_at: new Date().toISOString()
    })
    .eq('id', assetId);

  return { success: true, url };
}
```

---

### New Service: `brandingAnalysisService.js`

**Purpose:** Analyze uploaded brand assets with AI

**File Location:** `/src/services/brandingAnalysisService.js`

**Dependencies:**
```json
{
  "@anthropic-ai/sdk": "^0.20.0"
}
```

**Main Function:**
```javascript
import Anthropic from '@anthropic-ai/sdk';

export async function analyzeBrandAssets(params) {
  const { websiteUrl, instagramScreenshots, productImages } = params;

  // 1. Take website screenshot
  const websiteScreenshot = await takeScreenshot(websiteUrl);

  // 2. Prepare all images for Claude
  const allImages = [
    websiteScreenshot,
    ...instagramScreenshots,
    ...productImages
  ];

  const imageContents = await Promise.all(
    allImages.map(async (imageUrl) => {
      const imageData = await fetch(imageUrl).then(r => r.arrayBuffer());
      return {
        type: "image",
        source: {
          type: "base64",
          media_type: "image/png",
          data: Buffer.from(imageData).toString('base64')
        }
      };
    })
  );

  // 3. Call Claude API
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: [
          ...imageContents,
          {
            type: "text",
            text: `Analyze these brand images and extract:

1. **Color Palette**: Identify 3-5 dominant colors (hex codes)
2. **Style Keywords**: 3-5 adjectives (modern, elegant, vibrant, minimal, etc.)
3. **Industry/Vertical**: What type of business is this?
4. **Mood**: Overall emotional tone
5. **Target Audience**: Who is this brand targeting?
6. **Brand Personality**: 2-3 sentence description

Return as JSON:
{
  "color_palette": ["#...", "#..."],
  "style_keywords": ["modern", "elegant"],
  "industry": "restaurant",
  "vertical": "fine_dining",
  "mood": "warm and inviting",
  "target_audience": "upscale diners aged 30-55",
  "brand_personality": "Sophisticated yet approachable..."
}`
          }
        ]
      }
    ]
  });

  // 4. Parse response
  const analysisText = response.content[0].text;
  const brandAnalysis = JSON.parse(analysisText);

  return brandAnalysis;
}
```

---

### Flux Prompt Builder: `fluxPromptBuilder.js`

**Purpose:** Generate optimal Flux prompts from brand analysis

**File Location:** `/src/services/fluxPromptBuilder.js`

```javascript
export function buildFluxPrompt(brandingContext, styleOverrides = []) {
  const { brand_analysis } = brandingContext;

  const {
    style_keywords,
    industry,
    mood,
    color_palette
  } = brand_analysis;

  const styles = styleOverrides.length > 0
    ? styleOverrides
    : style_keywords;

  // Build industry-specific context
  const industryContext = getIndustryContext(industry);

  // Build color guidance
  const colorGuidance = color_palette.length > 0
    ? `color palette with ${color_palette.slice(0, 3).join(', ')}`
    : '';

  // Compose prompt
  const prompt = [
    `Professional ${industry} marketing background`,
    `${styles.join(', ')} style`,
    mood,
    colorGuidance,
    industryContext,
    'subject positioned left or center',
    'large open areas for text placement',
    'high contrast zones for readability',
    'print quality, 300 DPI',
    'no text, no logos, background only'
  ].filter(Boolean).join(', ');

  return prompt;
}

function getIndustryContext(industry) {
  const contexts = {
    restaurant: 'food photography aesthetic, appetizing atmosphere',
    retail: 'product showcase environment, shopping ambiance',
    service: 'professional office setting, clean modern space',
    real_estate: 'architectural photography, luxury property feel',
    healthcare: 'clean medical environment, trustworthy atmosphere',
    technology: 'futuristic digital aesthetic, innovative feel'
  };

  return contexts[industry] || 'professional business environment';
}
```

---

## 📊 Performance Comparison

### Current System (Puppeteer + HTML)

| Metric | Value |
|--------|-------|
| **First flyer** | 5-10 seconds |
| **Additional flyers (same campaign)** | 5-10 seconds each |
| **Bottleneck** | Puppeteer cold start (3-4s) |
| **Chrome dependency** | Yes (large Docker image) |
| **Visual quality** | Basic HTML/CSS |
| **Customization** | 3 fixed templates |
| **Cost per flyer** | ~$0.001 (compute only) |

### Proposed System (AI Backgrounds + Canvas)

| Metric | Value |
|--------|-------|
| **First flyer (new background)** | 6-9 seconds |
| **Additional flyers (cached background)** | <1 second ⚡ |
| **Bottleneck** | Flux API (3-5s, only first time) |
| **Chrome dependency** | No (simpler deployment) |
| **Visual quality** | AI-generated professional |
| **Customization** | Unlimited variations |
| **Cost per flyer** | ~$0.01 first, $0 cached |

### Key Improvements

- ✅ **10x faster** after first generation (cached backgrounds)
- ✅ **Significantly better quality** (AI-generated vs HTML templates)
- ✅ **Simpler infrastructure** (no Chrome/Puppeteer)
- ✅ **Infinite customization** (vs 3 templates)
- ✅ **Reusable assets** (background library)

---

## 💰 Cost Analysis

### Replicate API Costs

| Service | Model | Cost per Request | Use Case |
|---------|-------|------------------|----------|
| **Flux1.1-Pro** | Image Generation | ~$0.005-0.01 | Generate background |
| **CLIP-Seg** | Segmentation | ~$0.001-0.003 | Analyze composition |
| **Total per background** | - | **~$0.01** | One-time per background |
| **Per flyer (cached bg)** | - | **$0** | Reuse existing background |

### Monthly Cost Estimate

**Assumptions:**
- Average tenant: 3 campaigns/month
- 1 new background per campaign
- 5 locations per campaign = 5 flyers

**Costs:**
- Background generation: 3 campaigns × $0.01 = **$0.03/month**
- Flyer composition: 15 flyers × $0 = **$0/month** (Canvas is free)
- **Total: $0.03/tenant/month**

**Comparison to current:**
- Current Puppeteer compute: ~$0.015/flyer × 15 = **$0.225/month**
- **Savings: $0.195/month per tenant** (after first month)

### Annual Projection (1000 tenants)

- Current system: 1000 × $0.225 × 12 = **$2,700/year**
- Proposed system: 1000 × $0.03 × 12 = **$360/year**
- **Annual savings: $2,340** (87% reduction)

---

## 🚧 Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Backend:**
- [ ] Create migration: Add `campaign_backgrounds` table
- [ ] Create migration: Add `tenants.branding_ai_context` column
- [ ] Create migration: Add `assets.background_id` FK
- [ ] Implement `brandingAnalysisService.js` with Claude API
- [ ] Implement screenshot service for website capture
- [ ] Create endpoint: `POST /tenants/:id/branding-moment`
- [ ] Create endpoint: `GET /tenants/:id/branding-status`

**Frontend:**
- [ ] Design Branding Moment Wizard UI
- [ ] Implement file upload component
- [ ] Build brand analysis review screen
- [ ] Create loading states and progress indicators

**Testing:**
- [ ] Test branding analysis with sample images
- [ ] Validate JSON structure stored in database
- [ ] End-to-end test of wizard flow

---

### Phase 2: Background Generation (Week 3-4)

**Backend:**
- [ ] Install Replicate SDK: `pnpm add replicate`
- [ ] Implement `fluxPromptBuilder.js` service
- [ ] Create `backgroundWorker.js` worker
- [ ] Implement Flux1.1 API integration
- [ ] Implement CLIP-Seg composition analysis
- [ ] Create endpoint: `POST /tenants/:id/backgrounds/generate`
- [ ] Create endpoint: `GET /tenants/:id/backgrounds`
- [ ] Create endpoint: `PUT /backgrounds/:id/favorite`

**Frontend:**
- [ ] Design Background Library UI (grid view)
- [ ] Implement "Generate New" button and flow
- [ ] Build background preview modal with zone overlay
- [ ] Add favorite/unfavorite functionality
- [ ] Implement sort and filter controls

**Testing:**
- [ ] Test Flux prompt quality with various industries
- [ ] Validate composition analysis accuracy
- [ ] Test background generation with multiple styles
- [ ] Performance test: Measure Replicate API latency

---

### Phase 3: Flyer Composition (Week 5-6)

**Backend:**
- [ ] Install Canvas dependencies: `pnpm add canvas sharp`
- [ ] Create `flyerComposer.js` service
- [ ] Implement Canvas text rendering with word wrapping
- [ ] Implement zone selection algorithm (optimal text placement)
- [ ] Implement automatic contrast detection
- [ ] Modify `pdfService.js` to use Canvas instead of Puppeteer
- [ ] Update `POST /campaigns/:id/generate-flyer` endpoint
- [ ] Rename/modify `pdfWorker.js` → `flyerWorker.js`

**Frontend:**
- [ ] Modify campaign wizard: Add background selector
- [ ] Update asset preview to display PNG instead of PDF
- [ ] Implement "Download PNG" button
- [ ] Implement "Save As PDF" flow (browser print)
- [ ] Add "Regenerate with Different Background" option

**Testing:**
- [ ] Test Canvas text rendering quality
- [ ] Test QR code placement and scannability
- [ ] Test automatic contrast selection
- [ ] Compare output quality: Old (PDF) vs New (PNG)
- [ ] Performance test: Measure Canvas composition time

---

### Phase 4: Parallel Operation & Migration (Week 7-8)

**Backend:**
- [ ] Run both systems in parallel (feature flag)
- [ ] Add feature flag: `tenant.features.ai_flyers_enabled`
- [ ] Create migration script for existing tenants
- [ ] Monitor performance metrics (latency, costs)
- [ ] Implement rollback mechanism if issues arise

**Frontend:**
- [ ] Add feature flag check in campaign wizard
- [ ] Show "New AI Flyers" badge for beta users
- [ ] Implement opt-in flow for existing users
- [ ] Create comparison view (old vs new)

**Testing:**
- [ ] A/B test with sample tenants
- [ ] Collect user feedback on quality
- [ ] Monitor Replicate API costs vs estimates
- [ ] Test rollback procedure

---

### Phase 5: Optimization & Rollout (Week 9-10)

**Backend:**
- [ ] Optimize zone selection algorithm based on usage
- [ ] Add caching for Replicate API responses
- [ ] Implement background regeneration if user unhappy
- [ ] Add telemetry: Track background reuse rate
- [ ] Performance optimization: Preload popular backgrounds

**Frontend:**
- [ ] Polish UI based on beta feedback
- [ ] Add onboarding tooltips for new features
- [ ] Create help documentation
- [ ] Implement feedback collection widget

**Rollout:**
- [ ] Enable for 10% of tenants (Week 9)
- [ ] Enable for 50% of tenants (Week 9 end)
- [ ] Enable for 100% of tenants (Week 10)
- [ ] Deprecate Puppeteer worker (Week 10 end)

---

## ✅ Success Criteria

### Technical Metrics

- [ ] **Performance:** Average flyer generation time <1s (cached backgrounds)
- [ ] **Quality:** AI-generated backgrounds rated 4+/5 by users
- [ ] **Reliability:** <1% failure rate for background generation
- [ ] **Cost:** Monthly API costs <$0.05/tenant
- [ ] **Adoption:** >80% of new campaigns use AI backgrounds
- [ ] **Reuse:** Average background used 5+ times

### User Experience Metrics

- [ ] **Onboarding:** Branding Moment completion rate >70%
- [ ] **Satisfaction:** Net Promoter Score (NPS) >50
- [ ] **Engagement:** Users generate 2+ backgrounds per month
- [ ] **Download Rate:** PNG downloads increase 30% vs old PDFs

### Business Metrics

- [ ] **Cost Savings:** 80%+ reduction in compute costs
- [ ] **Deployment:** Remove Puppeteer from infrastructure
- [ ] **Retention:** Flyer feature usage increases 40%
- [ ] **Differentiation:** AI flyers become key selling point

---

## 🚨 Risks & Mitigations

### Risk 1: Replicate API Unreliability

**Risk:** Replicate cold starts or downtime delay flyer generation

**Mitigation:**
- Implement retry logic with exponential backoff
- Cache popular backgrounds aggressively
- Fall back to classic templates if API fails
- Monitor Replicate status page and alert on issues

---

### Risk 2: Poor Composition Analysis

**Risk:** CLIP-Seg/SAM2 misidentifies safe zones, text overlaps subjects

**Mitigation:**
- Manual zone adjustment UI (let users fix it)
- Fallback to centered layout if no safe zones detected
- Store successful zone configurations and use ML to improve
- A/B test CLIP-Seg vs SAM2 vs custom model

---

### Risk 3: High API Costs

**Risk:** Background generation costs exceed estimates

**Mitigation:**
- Limit free generations to 5/month per tenant
- Charge for additional backgrounds (premium feature)
- Aggressive caching and reuse promotion
- Monitor costs daily, alert if trending high

---

### Risk 4: Brand Analysis Inaccuracy

**Risk:** Claude misidentifies brand style, generates bad prompts

**Mitigation:**
- Always show brand analysis for user review before saving
- Allow manual editing of style keywords
- Provide prompt override option
- Store user corrections and fine-tune prompts over time

---

### Risk 5: Deployment Complexity

**Risk:** Canvas/Sharp dependencies cause build issues on Render

**Mitigation:**
- Test Canvas installation in Render environment early
- Dockerize worker with pre-installed dependencies
- Have Puppeteer fallback ready if Canvas fails
- Document system dependencies in `render.yaml`

---

## 🔄 Rollback Plan

If critical issues arise during rollout:

### Immediate Actions (Within 1 hour)

1. **Disable feature flag:**
   ```sql
   UPDATE tenants
   SET features = features || '{"ai_flyers_enabled": false}'::jsonb
   WHERE features->>'ai_flyers_enabled' = 'true';
   ```

2. **Revert to Puppeteer worker:**
   - Redeploy previous version from Git
   - Render will automatically route to old worker

3. **Notify affected tenants:**
   - In-app banner: "We're experiencing technical issues with AI Flyers. We've temporarily reverted to classic templates."

### Post-Incident (Within 24 hours)

1. **Root cause analysis:**
   - Review logs for error patterns
   - Identify which component failed (Flux, CLIP-Seg, Canvas)

2. **Fix and re-test:**
   - Deploy fix to staging
   - Run full integration tests
   - Test with affected tenants' data

3. **Gradual re-enable:**
   - Start with 1% of tenants
   - Monitor for 24 hours
   - Scale up if stable

---

## 📞 Support & Escalation

### Decision Points

**Frontend Team Lead - Required Decisions:**
1. **Approve UI designs** for Branding Moment Wizard (Phase 1)
2. **Approve Background Library** interface design (Phase 2)
3. **Approve modified campaign wizard** flow (Phase 3)
4. **Sign off on beta testing** with sample tenants (Phase 4)

**Backend Team Lead - Required Decisions:**
1. **Select composition analysis model** (CLIP-Seg vs SAM2)
2. **Set Replicate API rate limits** and error handling strategy
3. **Define background caching strategy** (TTL, storage limits)
4. **Approve database schema migrations**

**Both Teams - Required Decisions:**
1. **Go/No-Go for each phase** based on testing results
2. **Rollout percentage** in Phase 5 (10% → 50% → 100%)
3. **Deprecation timeline** for Puppeteer system
4. **Pricing strategy** for premium background generations

---

## 📋 Open Questions

1. **Should we allow users to upload custom backgrounds?**
   - Pros: More control, users can use existing brand assets
   - Cons: No composition analysis, manual zone placement

2. **Should we generate multiple background variations per request?**
   - Current: 1 background per generation
   - Alternative: Generate 3-5 variations, user picks best
   - Trade-off: 3-5x API costs vs better user choice

3. **How many backgrounds should we cache per tenant?**
   - Option A: Unlimited (storage cost grows)
   - Option B: Limit to 20, delete oldest (simple)
   - Option C: Limit based on tenant plan (free: 5, paid: 50)

4. **Should PNG → PDF conversion happen server-side or client-side?**
   - Current proposal: Client-side (browser "Print to PDF")
   - Alternative: Server-side with Sharp (consistent quality)
   - Trade-off: Simple vs more control

5. **Do we need real-time preview during background generation?**
   - Current: Show loading spinner, reveal when done
   - Alternative: Stream preview updates (Replicate supports webhooks)
   - Trade-off: Complexity vs better UX

---

## 🎯 Recommendation

**Backend Team Lead Assessment:** ✅ **APPROVE WITH CONDITIONS**

### Why This is a Good Idea

1. **Solves real problems:** Current flyers are slow, basic quality, hard to deploy
2. **Significant performance gains:** 10x faster after first generation
3. **Better user experience:** AI backgrounds are more visually appealing
4. **Cost effective:** Lower long-term costs due to background reuse
5. **Simpler infrastructure:** No more Puppeteer/Chrome dependency
6. **Competitive advantage:** AI-generated flyers are a unique selling point

### Conditions for Approval

1. **Phase 1 must complete successfully** before starting Phase 2
   - Branding analysis must be accurate (>80% user approval)
   - All database migrations must be tested on staging

2. **Replicate API cost monitoring** from day one
   - Set hard limit: $100/month for testing
   - Alert if approaching limit

3. **Canvas rendering quality** must match or exceed Puppeteer
   - Side-by-side comparison with existing PDFs
   - User testing with 10 sample tenants

4. **Rollback plan tested** before Phase 4 rollout
   - Practice disabling feature flag
   - Verify Puppeteer worker still functional

5. **Frontend Team Lead approval** on all UI designs
   - Cannot proceed to next phase without sign-off

### Next Steps

1. **Frontend Team Lead:** Review this proposal and approve/request changes
2. **Both Teams:** Schedule kickoff meeting to align on Phase 1 timeline
3. **Backend:** Begin Phase 1 database migrations and Claude API integration
4. **Frontend:** Begin Branding Moment Wizard UI design
5. **Weekly syncs:** Every Monday to review progress and blockers

---

**Document Status:** Awaiting Frontend Team Lead Approval
**Last Updated:** 2025-10-23
**Next Review:** After Frontend approval
