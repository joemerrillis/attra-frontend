# 📊 Complete Data Model & Relationships Documentation

**Date:** 2025-10-20 (Updated with location_id FK)
**Priority:** CRITICAL
**Status:** ✅ RESOLVED - Backend added optional location_id FK to assets table

---

## ✅ The Solution (IMPLEMENTED)

**Migration completed:** Backend added `location_id UUID` (nullable) FK to assets table

**This supports three asset types:**
1. **Flyers** - `location_id` set (one-to-one: each flyer for a specific location)
2. **Business cards** - `location_id` null (location-agnostic, used anywhere)
3. **Menu squares** - Multiple assets with same `location_id` (many-to-one: multiple menu items at one location)

**Key insight:** The relationship is OPTIONAL - not all assets need a location.

---

## 📐 Core Data Model

### Entity Relationship Overview

```
┌─────────────┐
│   TENANTS   │ (The organization/business using Attra)
└──────┬──────┘
       │
       ├──────► TEAM_MEMBERS (users who belong to tenant)
       │
       ├──────► CAMPAIGNS (marketing campaigns)
       │        │
       │        ├──────► ASSETS (PDFs, images generated for campaign)
       │        │
       │        └──────► QR_LINKS (QR codes for the campaign)
       │                 │
       │                 └──────► SCANS (when someone scans a QR code)
       │                          │
       │                          └──────► CONTACTS (captured lead info)
       │
       └──────► LOCATIONS (business locations/distribution points)
```

**KEY INSIGHT:** Assets and Locations are **SIBLINGS** under Tenant, NOT directly related.

---

## 🔗 Table Relationships

### tenants
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT,
  branding JSONB,
  plan_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Relationships:**
- `tenants` → `campaigns` (one-to-many)
- `tenants` → `locations` (one-to-many)
- `tenants` → `assets` (one-to-many)
- `tenants` → `team_members` (one-to-many)

---

### campaigns
```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT, -- 'draft' or 'active'
  goal TEXT,
  headline TEXT,
  subheadline TEXT,
  cta TEXT,
  layout TEXT, -- 'classic', 'modern', 'minimal'
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  budget NUMERIC,
  scans INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Relationships:**
- `campaigns.tenant_id` → `tenants.id` (many-to-one)
- `campaigns` → `assets` (one-to-many via `assets.campaign_id`)
- `campaigns` → `qr_links` (one-to-many via `qr_links.campaign_id`)

---

### assets
```sql
CREATE TABLE assets (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,  -- ✅ NEW: Optional location
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL, -- 'flyer', 'pdf', 'image', 'business_card', 'menu_square'
  file_url TEXT,
  file_size INTEGER,
  file_type TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_assets_location_id ON assets(location_id);
```

**Relationships:**
- `assets.tenant_id` → `tenants.id` (many-to-one, REQUIRED)
- `assets.campaign_id` → `campaigns.id` (many-to-one, OPTIONAL)
- `assets.location_id` → `locations.id` (many-to-one, OPTIONAL) ✅ **NEW**

**✅ UPDATED:** Assets now have an OPTIONAL foreign key to locations!
- Flyers: location_id populated (each flyer for specific location)
- Business cards: location_id null (used anywhere)
- Menu squares: Multiple assets share same location_id (many items at one location)

---

### locations
```sql
CREATE TABLE locations (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  location_type TEXT, -- 'business', 'distribution', etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Relationships:**
- `locations.tenant_id` → `tenants.id` (many-to-one)

**⚠️ CRITICAL:** Locations do NOT reference assets or campaigns!

---

### qr_links
```sql
CREATE TABLE qr_links (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  redirect_url TEXT NOT NULL,
  base_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Relationships:**
- `qr_links.tenant_id` → `tenants.id` (many-to-one)
- `qr_links.campaign_id` → `campaigns.id` (many-to-one, NULLABLE)
- `qr_links` → `scans` (one-to-many via `scans.qr_link_id`)

---

### scans
```sql
CREATE TABLE scans (
  id UUID PRIMARY KEY,
  qr_link_id UUID NOT NULL REFERENCES qr_links(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  campaign_id UUID REFERENCES campaigns(id),
  ip_address TEXT,
  user_agent TEXT,
  location_data JSONB, -- Geolocation from IP
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Relationships:**
- `scans.qr_link_id` → `qr_links.id` (many-to-one)
- `scans.tenant_id` → `tenants.id` (many-to-one)
- `scans.campaign_id` → `campaigns.id` (many-to-one, NULLABLE)

---

### contacts
```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  campaign_id UUID REFERENCES campaigns(id),
  qr_link_id UUID REFERENCES qr_links(id),
  name TEXT,
  email TEXT,
  phone TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Relationships:**
- `contacts.tenant_id` → `tenants.id` (many-to-one)
- `contacts.campaign_id` → `campaigns.id` (many-to-one, NULLABLE)
- `contacts.qr_link_id` → `qr_links.id` (many-to-one, NULLABLE)

---

## 🔄 How Frontend Uses These Relationships

### 1. PDF Generation Flow

**Endpoint:** `GET /api/internal/campaigns/{id}/assets`

**Frontend code:** `src/lib/pdf-api.ts:83-85`

```typescript
async getAssets(campaignId: string): Promise<{ assets: Asset[] }> {
  return fetchWithAuth(`/api/internal/campaigns/${campaignId}/assets`);
}
```

**Expected Query (CORRECT):**
```sql
-- Get assets for a campaign
SELECT *
FROM assets
WHERE campaign_id = $1
  AND tenant_id = $2; -- tenant_id from JWT for security
```

**❌ WRONG Query (causing error):**
```sql
-- DO NOT DO THIS - assets and locations are NOT related
SELECT assets.*, locations.*
FROM assets
LEFT JOIN locations ON ??? -- NO RELATIONSHIP EXISTS
WHERE assets.campaign_id = $1;
```

**✅ If you need location data with assets:**
```sql
-- Query assets and locations separately, join in application layer
-- OR use tenant_id as the common key

SELECT
  a.*,
  l.id as location_id,
  l.name as location_name
FROM assets a
CROSS JOIN LATERAL (
  SELECT id, name
  FROM locations
  WHERE tenant_id = a.tenant_id
  LIMIT 1
) l
WHERE a.campaign_id = $1
  AND a.tenant_id = $2;
```

---

### 2. Generate Flyer Flow

**Step 1:** Create asset record

**Endpoint:** `POST /api/internal/assets`

**Frontend sends:**
```json
{
  "name": "Campaign Flyer",
  "asset_type": "flyer",
  "campaign_id": "campaign-uuid",
  "metadata": {
    "layout": "modern",
    "headline": "...",
    "subheadline": "...",
    "cta": "..."
  }
}
```

**Backend should:**
- Extract `tenant_id` from JWT
- Insert into assets table
- Return `{ asset: { id, ... } }`

---

**Step 2:** Generate PDF

**Endpoint:** `POST /api/internal/campaigns/{id}/generate-flyer`

**Frontend sends:**
```json
{
  "assetId": "asset-uuid",
  "locationId": "location-uuid",
  "layout": "modern"
}
```

**Why locationId?**
- Location is used for CONTEXTUAL DATA in PDF generation
- Location address might appear on the flyer
- Location is NOT stored on the asset record
- It's just used during PDF generation process

**Backend should:**
1. Fetch asset by `assetId`
2. Fetch location by `locationId` (for context only)
3. Fetch campaign data from `asset.campaign_id`
4. Generate PDF with all this data
5. Upload PDF to storage
6. Update `asset.file_url = <storage_url>`

**⚠️ Location is NOT persisted on the asset!**

---

### 3. QR Code Scanning Flow

**Step 1:** User scans QR code → lands on `/q/{qr_link_id}`

**Endpoint:** `GET /api/internal/qr-links/{id}`

**Expected response:**
```json
{
  "id": "qr-link-uuid",
  "campaign_id": "campaign-uuid",
  "redirect_url": "https://business-website.com/offer",
  "tenant": {
    "id": "tenant-uuid",
    "name": "Acme Inc",
    "branding": {
      "logo_url": "https://..."
    }
  },
  "campaign": {
    "id": "campaign-uuid",
    "headline": "Special Offer!",
    "subheadline": "Get 20% off",
    "cta": "Claim Now"
  }
}
```

**Query:**
```sql
SELECT
  qr.id,
  qr.campaign_id,
  qr.redirect_url,
  qr.base_url,

  -- Nested tenant
  jsonb_build_object(
    'id', t.id,
    'name', t.name,
    'branding', t.branding
  ) as tenant,

  -- Nested campaign
  jsonb_build_object(
    'id', c.id,
    'headline', c.headline,
    'subheadline', c.subheadline,
    'cta', c.cta
  ) as campaign

FROM qr_links qr
INNER JOIN tenants t ON qr.tenant_id = t.id
LEFT JOIN campaigns c ON qr.campaign_id = c.id
WHERE qr.id = $1
  AND qr.is_active = true;
```

---

**Step 2:** Log scan event

**Endpoint:** `POST /api/internal/scans`

**Frontend sends:**
```json
{
  "qr_link_id": "qr-link-uuid"
}
```

**Backend should:**
- Extract `tenant_id` and `campaign_id` from QR link
- Insert scan record with IP, user agent, timestamp
- Return success

```sql
INSERT INTO scans (
  qr_link_id,
  tenant_id,
  campaign_id,
  ip_address,
  user_agent,
  location_data,
  created_at
)
SELECT
  $1, -- qr_link_id
  qr.tenant_id,
  qr.campaign_id,
  $2, -- ip_address
  $3, -- user_agent
  $4, -- location_data (from IP geolocation)
  NOW()
FROM qr_links qr
WHERE qr.id = $1;
```

---

**Step 3:** Capture contact info

**Endpoint:** `POST /api/internal/contacts`

**Frontend sends:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "qr_link_id": "qr-link-uuid",
  "campaign_id": "campaign-uuid"
}
```

**Backend should:**
- Extract `tenant_id` from QR link
- Insert contact record
- Return success

---

### 4. Campaign Analytics Flow

**Endpoint:** `GET /api/internal/campaigns/{id}/stats`

**Expected response:**
```json
{
  "total_scans": 142,
  "total_contacts": 38,
  "conversion_rate": 0.267,
  "recent_scans": [
    {
      "id": "scan-uuid",
      "created_at": "2025-10-20T12:00:00Z",
      "location_data": { "city": "San Francisco", "country": "US" }
    }
  ],
  "top_locations": [
    { "city": "San Francisco", "count": 52 },
    { "city": "New York", "count": 38 }
  ]
}
```

**Query:**
```sql
-- Total scans
SELECT COUNT(*) as total_scans
FROM scans
WHERE campaign_id = $1;

-- Total contacts
SELECT COUNT(*) as total_contacts
FROM contacts
WHERE campaign_id = $1;

-- Recent scans
SELECT id, created_at, location_data
FROM scans
WHERE campaign_id = $1
ORDER BY created_at DESC
LIMIT 10;

-- Top locations (from scan geolocation, NOT from locations table!)
SELECT
  location_data->>'city' as city,
  COUNT(*) as count
FROM scans
WHERE campaign_id = $1
  AND location_data IS NOT NULL
GROUP BY location_data->>'city'
ORDER BY count DESC
LIMIT 5;
```

---

## 🎯 Key Takeaways for Backend

### 1. Assets ↔ Locations: NO DIRECT RELATIONSHIP
- Assets belong to campaigns (via `campaign_id`)
- Locations belong to tenants (via `tenant_id`)
- They are related through their common `tenant_id` ONLY
- Location is used CONTEXTUALLY during PDF generation, not stored on asset

### 2. Common Join Pattern
```sql
-- To get assets with potential location context:
SELECT
  a.*,
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', l.id,
        'name', l.name,
        'address', l.address
      )
    )
    FROM locations l
    WHERE l.tenant_id = a.tenant_id
  ) as available_locations
FROM assets a
WHERE a.campaign_id = $1
  AND a.tenant_id = $2;
```

### 3. Campaign Assets Query (getCampaignAssets)
```sql
-- CORRECT query
SELECT
  a.id,
  a.tenant_id,
  a.campaign_id,
  a.name,
  a.asset_type,
  a.file_url,
  a.file_size,
  a.file_type,
  a.metadata,
  a.created_at,
  a.updated_at
FROM assets a
WHERE a.campaign_id = $1
  AND a.tenant_id = $2 -- Security check from JWT
ORDER BY a.created_at DESC;

-- Return as:
{
  "assets": [...]
}
```

**DO NOT try to join locations here!**

### 4. Generate Flyer Endpoint
```typescript
// POST /api/internal/campaigns/:id/generate-flyer
// Body: { assetId, locationId, layout }

// Step 1: Fetch asset
const asset = await db.query(
  'SELECT * FROM assets WHERE id = $1',
  [assetId]
);

// Step 2: Fetch location (for context)
const location = await db.query(
  'SELECT * FROM locations WHERE id = $1',
  [locationId]
);

// Step 3: Fetch campaign
const campaign = await db.query(
  'SELECT * FROM campaigns WHERE id = $1',
  [asset.campaign_id]
);

// Step 4: Generate PDF using all this data
const pdfBuffer = generatePDF({
  layout: body.layout,
  headline: campaign.headline,
  subheadline: campaign.subheadline,
  cta: campaign.cta,
  businessAddress: location.address, // Use location for context
  // ... other data
});

// Step 5: Upload PDF and update asset
const fileUrl = await uploadToStorage(pdfBuffer, asset.id);
await db.query(
  'UPDATE assets SET file_url = $1, file_size = $2, file_type = $3 WHERE id = $4',
  [fileUrl, pdfBuffer.length, 'application/pdf', asset.id]
);
```

### 5. QR Link Analytics

**Scans are NOT related to locations table!**

Scans have `location_data` JSONB field with IP geolocation:
```json
{
  "city": "San Francisco",
  "region": "California",
  "country": "US",
  "lat": 37.7749,
  "lng": -122.4194
}
```

This is from IP geolocation service, NOT from the `locations` table.

---

## 🧪 Testing Queries

### Test 1: Get campaign assets (should work)
```sql
SELECT * FROM assets WHERE campaign_id = '<campaign-id>';
```

### Test 2: Get tenant locations (should work)
```sql
SELECT * FROM locations WHERE tenant_id = '<tenant-id>';
```

### Test 3: Get assets WITH location context (should work)
```sql
SELECT
  a.*,
  l.id as location_id,
  l.name as location_name
FROM assets a
CROSS JOIN LATERAL (
  SELECT id, name
  FROM locations
  WHERE tenant_id = a.tenant_id
  LIMIT 1
) l
WHERE a.campaign_id = '<campaign-id>';
```

### Test 4: Direct join assets ↔ locations (SHOULD FAIL)
```sql
-- This will fail because there's no foreign key
SELECT * FROM assets a
INNER JOIN locations l ON a.??? = l.???; -- NO RELATIONSHIP!
```

---

## 📋 Backend Action Items

- [ ] Remove any direct JOINs between `assets` and `locations`
- [ ] Use `tenant_id` as common key if you need both
- [ ] In `getCampaignAssets`, only query assets table
- [ ] In `generateFlyer`, fetch location separately for contextual data
- [ ] Remember: `location_id` in generate-flyer request is for PDF content, not for asset storage
- [ ] Scan `location_data` is from IP geolocation, not `locations` table
- [ ] All analytics queries should use `scans.location_data` JSONB, not join to locations

---

## 🔍 Quick Reference

| Table | Primary Parent | Foreign Keys |
|-------|---------------|--------------|
| tenants | (root) | - |
| campaigns | tenants | `tenant_id` → tenants.id |
| assets | tenants, campaigns | `tenant_id` → tenants.id, `campaign_id` → campaigns.id |
| locations | tenants | `tenant_id` → tenants.id |
| qr_links | tenants, campaigns | `tenant_id` → tenants.id, `campaign_id` → campaigns.id |
| scans | tenants, campaigns, qr_links | `tenant_id` → tenants.id, `campaign_id` → campaigns.id, `qr_link_id` → qr_links.id |
| contacts | tenants, campaigns, qr_links | `tenant_id` → tenants.id, `campaign_id` → campaigns.id, `qr_link_id` → qr_links.id |

**Assets ↔ Locations:** ❌ NO DIRECT RELATIONSHIP

---

**Generated:** 2025-10-20
**Frontend Repo:** attra-frontend
**Issue:** Backend joining assets ↔ locations incorrectly
