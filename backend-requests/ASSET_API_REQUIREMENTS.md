# 📋 Backend API Requirements: POST /api/internal/assets

**Date:** 2025-10-20
**Priority:** HIGH
**Issue:** Asset creation returning 500 Internal Server Error during PDF generation

---

## The Error

```json
{
  "error": "Internal Server Error",
  "context": "createAsset"
}
```

**Status Code:** `500 Internal Server Error`

**Location:** `POST /api/internal/assets`

**Impact:**
- ⚠️ PDF generation fails completely
- ⚠️ Users cannot generate flyers from campaigns
- ⚠️ Campaign wizard gets stuck at Generate step

---

## The Critical API Call

### Request

**Endpoint:** `POST /api/internal/assets`

**Method:** POST

**Headers:**
```http
Authorization: Bearer {supabase_jwt_token}
Content-Type: application/json
```

**Authentication:**
- Uses Supabase JWT from session
- Backend should extract `tenant_id` from JWT's `app_metadata.tenant_id`
- Should create asset for that tenant

---

## Request Body Structure

**Example Payload:**
```json
{
  "name": "new_clients Campaign - 10/20/2025",
  "asset_type": "flyer",
  "campaign_id": "30c8e58a-7c30-4527-bbad-67aacff8a804",
  "metadata": {
    "layout": "modern",
    "headline": "Transform Your Space",
    "subheadline": "Professional interior design services",
    "cta": "Scan to schedule your free consultation",
    "branding": {
      "logo_url": "https://example.com/logo.png",
      "primary_color": "#4F46E5"
    }
  }
}
```

### Field Requirements

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | ✅ Yes | Human-readable asset name |
| `asset_type` | string | ✅ Yes | Should be "flyer" for campaign flyers |
| `campaign_id` | string (uuid) | ⚠️ Optional | Campaign ID if asset is linked to a campaign |
| `metadata` | object | ⚠️ Optional | Flexible JSON object with flyer details |

### metadata Object (for flyers)

| Field | Type | Notes |
|-------|------|-------|
| `layout` | string | One of: "classic", "modern", "minimal" |
| `headline` | string | Main flyer headline |
| `subheadline` | string | Supporting text |
| `cta` | string | Call-to-action text |
| `branding` | object | Tenant branding (logo, colors) |

---

## Expected Response Structure

**Status Code:** `200 OK` or `201 Created`

**Response Body:**
```json
{
  "asset": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "tenant_id": "tenant-uuid",
    "name": "new_clients Campaign - 10/20/2025",
    "asset_type": "flyer",
    "campaign_id": "30c8e58a-7c30-4527-bbad-67aacff8a804",
    "file_url": null,
    "file_size": null,
    "file_type": null,
    "metadata": {
      "layout": "modern",
      "headline": "Transform Your Space",
      "subheadline": "Professional interior design services",
      "cta": "Scan to schedule your free consultation",
      "branding": {
        "logo_url": "https://example.com/logo.png",
        "primary_color": "#4F46E5"
      }
    },
    "created_at": "2025-10-20T12:00:00Z",
    "updated_at": "2025-10-20T12:00:00Z"
  }
}
```

---

## Response Field Requirements

### Top Level
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `asset` | object | ✅ Yes | Nested asset object |

### asset Object
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string (uuid) | ✅ Yes | Asset ID (primary key) |
| `tenant_id` | string (uuid) | ✅ Yes | Tenant ID (from JWT) |
| `name` | string | ✅ Yes | Asset name (from request) |
| `asset_type` | string | ✅ Yes | Asset type (from request) |
| `campaign_id` | string (uuid) \| null | ✅ Yes | Campaign ID (from request or null) |
| `file_url` | string \| null | ✅ Yes | PDF URL (null until generated) |
| `file_size` | number \| null | ✅ Yes | File size in bytes (null initially) |
| `file_type` | string \| null | ✅ Yes | MIME type (null initially, will be "application/pdf") |
| `metadata` | object | ✅ Yes | Copy of metadata from request |
| `created_at` | string (ISO 8601) | ✅ Yes | Creation timestamp |
| `updated_at` | string (ISO 8601) | ✅ Yes | Last update timestamp |

---

## Frontend Code Flow

**File:** `src/hooks/usePDFGeneration.ts`

```typescript
// Step 1: Create asset record (THIS IS FAILING)
const { asset } = await pdfApi.createAsset({
  name: data.name,
  asset_type: 'flyer',
  campaign_id: data.campaignId,
  metadata: {
    layout: data.layout,
    headline: data.headline,
    subheadline: data.subheadline,
    cta: data.cta,
    branding: data.branding,
  },
});

// Step 2: Generate PDF flyer (never reached because step 1 fails)
await pdfApi.generateFlyer(data.campaignId, {
  assetId: asset.id,
  locationId: data.locationId,
  layout: data.layout,
});
```

**What Frontend Expects:**
1. POST to `/api/internal/assets` with campaign data
2. Backend creates asset record with `file_url = null` initially
3. Backend returns `{ asset: { id, ... } }`
4. Frontend extracts `asset.id`
5. Frontend calls `/api/internal/campaigns/{id}/generate-flyer` with `assetId`
6. Backend generates PDF and updates asset's `file_url`

---

## Common Error Scenarios

### Scenario 1: Missing tenant_id in Database
**Symptom:** 500 error with database constraint violation
**Cause:** assets table requires tenant_id but it's not being extracted from JWT
**Fix:** Extract `tenant_id` from JWT `app_metadata.tenant_id`

```typescript
// Pseudocode
const token = req.headers.authorization.replace('Bearer ', '');
const decoded = jwt.verify(token, supabaseJwtSecret);
const tenantId = decoded.app_metadata.tenant_id;

if (!tenantId) {
  return res.status(400).json({ error: 'No tenant_id in JWT' });
}
```

---

### Scenario 2: campaign_id Foreign Key Error
**Symptom:** 500 error with foreign key constraint violation
**Cause:** campaign_id doesn't exist in campaigns table
**Fix:**
- Verify campaign exists before creating asset
- Or make campaign_id nullable and allow orphan assets

```sql
-- Check if campaign exists
SELECT id FROM campaigns
WHERE id = $1 AND tenant_id = $2;
```

---

### Scenario 3: metadata Column Type Mismatch
**Symptom:** 500 error with JSON parsing or type error
**Cause:** metadata column is not JSONB or JSON type
**Fix:** Ensure metadata column is `JSONB` type

```sql
-- Migration to fix metadata column
ALTER TABLE assets
ALTER COLUMN metadata TYPE JSONB
USING metadata::JSONB;
```

---

### Scenario 4: Missing Required Columns
**Symptom:** 500 error with "column does not exist"
**Cause:** Database schema missing expected columns
**Fix:** Add missing columns

```sql
-- Expected assets table schema
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  campaign_id UUID REFERENCES campaigns(id),
  file_url TEXT,
  file_size INTEGER,
  file_type TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Implementation Guide

### Step 1: Extract tenant_id from JWT

```typescript
// Pseudocode
const token = req.headers.authorization?.replace('Bearer ', '');
if (!token) {
  return res.status(401).json({ error: 'No authorization token' });
}

const decoded = jwt.verify(token, supabaseJwtSecret);
const tenantId = decoded.app_metadata?.tenant_id;

if (!tenantId) {
  return res.status(400).json({ error: 'No tenant_id in JWT' });
}
```

---

### Step 2: Validate campaign_id (if provided)

```typescript
// Pseudocode
if (req.body.campaign_id) {
  const campaign = await db.query(
    'SELECT id FROM campaigns WHERE id = $1 AND tenant_id = $2',
    [req.body.campaign_id, tenantId]
  );

  if (!campaign.rows.length) {
    return res.status(404).json({
      error: 'Campaign not found or not accessible'
    });
  }
}
```

---

### Step 3: Insert asset record

```sql
INSERT INTO assets (
  tenant_id,
  name,
  asset_type,
  campaign_id,
  file_url,
  file_size,
  file_type,
  metadata,
  created_at,
  updated_at
) VALUES (
  $1, -- tenant_id (from JWT)
  $2, -- name (from request body)
  $3, -- asset_type (from request body)
  $4, -- campaign_id (from request body, can be null)
  NULL, -- file_url (null initially)
  NULL, -- file_size (null initially)
  NULL, -- file_type (null initially)
  $5, -- metadata (from request body as JSONB)
  NOW(),
  NOW()
)
RETURNING *;
```

**Parameters:**
- `$1` = `tenantId` (from JWT)
- `$2` = `req.body.name`
- `$3` = `req.body.asset_type`
- `$4` = `req.body.campaign_id || null`
- `$5` = `JSON.stringify(req.body.metadata || {})`

---

### Step 4: Return formatted response

```typescript
const asset = result.rows[0];

return res.status(201).json({
  asset: {
    id: asset.id,
    tenant_id: asset.tenant_id,
    name: asset.name,
    asset_type: asset.asset_type,
    campaign_id: asset.campaign_id,
    file_url: asset.file_url,
    file_size: asset.file_size,
    file_type: asset.file_type,
    metadata: asset.metadata,
    created_at: asset.created_at,
    updated_at: asset.updated_at,
  }
});
```

---

## Testing

### Manual Test with cURL

```bash
# Get JWT token from browser (DevTools → Application → Local Storage)
export JWT_TOKEN="your-jwt-token-here"

curl -X POST \
  https://api.attra.io/api/internal/assets \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Campaign Flyer",
    "asset_type": "flyer",
    "campaign_id": "30c8e58a-7c30-4527-bbad-67aacff8a804",
    "metadata": {
      "layout": "modern",
      "headline": "Test Headline",
      "subheadline": "Test Subheadline",
      "cta": "Scan to learn more"
    }
  }' \
  | jq '.'
```

**Expected Output:**
```json
{
  "asset": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "tenant_id": "tenant-uuid",
    "name": "Test Campaign Flyer",
    "asset_type": "flyer",
    "campaign_id": "30c8e58a-7c30-4527-bbad-67aacff8a804",
    "file_url": null,
    "file_size": null,
    "file_type": null,
    "metadata": {
      "layout": "modern",
      "headline": "Test Headline",
      "subheadline": "Test Subheadline",
      "cta": "Scan to learn more"
    },
    "created_at": "2025-10-20T12:00:00Z",
    "updated_at": "2025-10-20T12:00:00Z"
  }
}
```

---

### Validation Checklist

- [ ] Response status is `200 OK` or `201 Created`
- [ ] Response has `asset` object (not direct object)
- [ ] `asset.id` is a valid UUID
- [ ] `asset.tenant_id` matches JWT tenant
- [ ] `asset.name` matches request
- [ ] `asset.asset_type` matches request
- [ ] `asset.campaign_id` matches request (or null)
- [ ] `asset.file_url` is null initially
- [ ] `asset.metadata` contains all request metadata
- [ ] `asset.created_at` and `asset.updated_at` are ISO timestamps

---

## Error Handling

### If tenant_id missing from JWT:
```json
{
  "error": "No tenant_id in JWT metadata",
  "code": "NO_TENANT_ID"
}
```
**Status:** `400 Bad Request`

---

### If campaign doesn't exist:
```json
{
  "error": "Campaign not found or not accessible",
  "code": "CAMPAIGN_NOT_FOUND"
}
```
**Status:** `404 Not Found`

---

### If validation fails:
```json
{
  "error": "name and asset_type are required",
  "code": "VALIDATION_ERROR"
}
```
**Status:** `400 Bad Request`

---

### If database error:
```json
{
  "error": "Failed to create asset",
  "code": "DATABASE_ERROR",
  "details": "..."
}
```
**Status:** `500 Internal Server Error`

---

## Success Criteria

✅ Frontend successfully creates asset record
✅ Asset ID is returned in response
✅ Frontend can proceed to PDF generation step
✅ No 500 errors in production logs
✅ Assets are properly linked to tenants and campaigns

---

## Database Schema Reference

```sql
-- Expected assets table structure
CREATE TABLE assets (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,

  -- Asset metadata
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL, -- 'flyer', 'image', etc.

  -- File information (populated after PDF generation)
  file_url TEXT,
  file_size INTEGER,
  file_type TEXT,

  -- Flexible metadata storage
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_assets_tenant_id ON assets(tenant_id);
CREATE INDEX idx_assets_campaign_id ON assets(campaign_id);
CREATE INDEX idx_assets_asset_type ON assets(asset_type);
```

---

## Questions?

Contact frontend team if you need:
- Example JWT token for testing
- Database schema details
- More context on the PDF generation flow

---

**Generated:** 2025-10-20
**Frontend Repo:** attra-frontend
**Backend Endpoint:** `POST /api/internal/assets`
