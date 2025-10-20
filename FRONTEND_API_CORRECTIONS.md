# 🔧 Frontend API Corrections Document

**Generated:** 2025-10-20
**Backend Version:** Latest (commit 0c7d9e6)

This document compares the frontend's expected API endpoints against the actual backend implementation and provides corrections where needed.

---

## ❌ CRITICAL ISSUES

### 1. Contact Update Method Mismatch
**Frontend Expects:**
```
PATCH /api/internal/contacts/:id
```

**Backend Actually Has:**
```
PUT /api/internal/contacts/:id
```

**Fix Required:**
Change the frontend's contact update API call from `PATCH` to `PUT`.

```typescript
// ❌ WRONG
await fetch(`/api/internal/contacts/${id}`, {
  method: 'PATCH',
  body: JSON.stringify(updates)
});

// ✅ CORRECT
await fetch(`/api/internal/contacts/${id}`, {
  method: 'PUT',
  body: JSON.stringify(updates)
});
```

---

### 2. QR Scan Endpoint Method Mismatch
**Frontend Expects:**
```
POST /q/:id
```

**Backend Actually Has:**
```
GET /q/:id
```

**Explanation:**
The `/q/:id` endpoint is a **QR code redirect endpoint**, not a scan logging endpoint. When someone scans a QR code, they visit this URL via GET request, and the backend:
1. Logs the scan automatically (in the handler)
2. Redirects them to the destination URL

**Fix Required:**
The frontend should **NOT call this endpoint**. QR code scans are logged automatically when users scan the physical QR code and visit the URL.

If the frontend needs to manually log a scan for testing purposes, there is no direct endpoint - scans are only logged via the redirect flow.

```typescript
// ❌ WRONG - Don't call this from frontend
await fetch(`/q/${qrId}`, { method: 'POST', body: { ... } });

// ✅ CORRECT - Just redirect users to the URL
window.location.href = `/q/${qrId}`;
// Backend will log the scan and redirect automatically
```

---

### 3. Billing Portal Endpoint Missing
**Frontend Expects:**
```
POST /api/internal/billing/portal-session
```

**Backend Status:** ❌ **Does not exist**

**Fix Required:**
This endpoint needs to be built on the backend, OR the frontend needs to remove this feature until the backend implements Stripe integration.

**Recommended Action:**
Remove billing portal functionality from frontend until backend Stripe integration is complete.

---

## ⚠️ REQUIRED PARAMETER UPDATES

### 4. Generate Flyer Endpoint - Missing Required Parameters
**Frontend Expects:**
```
POST /api/internal/campaigns/:id/generate-flyer
Body: { "assetId": "asset-uuid" }
```

**Backend Actually Requires:**
```
POST /api/internal/campaigns/:id/generate-flyer
Body: {
  "assetId": "uuid",      // ✅ Already included
  "locationId": "uuid",   // ❌ MISSING - REQUIRED
  "layout": "classic"     // ❌ MISSING - Optional (defaults to "classic")
}
```

**Fix Required:**
Add `locationId` and optionally `layout` to the request body.

```typescript
// ❌ WRONG
await fetch(`/api/internal/campaigns/${campaignId}/generate-flyer`, {
  method: 'POST',
  body: JSON.stringify({
    assetId: asset.id
  })
});

// ✅ CORRECT
await fetch(`/api/internal/campaigns/${campaignId}/generate-flyer`, {
  method: 'POST',
  body: JSON.stringify({
    assetId: asset.id,
    locationId: location.id,  // REQUIRED
    layout: 'modern'          // Optional: 'classic', 'modern', or 'minimal'
  })
});
```

**Backend Schema:**
- `assetId` (string, UUID, **required**) - Asset ID to generate flyer from
- `locationId` (string, UUID, **required**) - Location ID for the flyer
- `layout` (string, **optional**) - One of: `classic`, `modern`, `minimal` (default: `classic`)

**Response:**
```json
{
  "message": "Flyer generation queued",
  "jobId": "job-uuid",
  "assetId": "asset-uuid"
}
```

---

## ⚠️ PARAMETER NAME DIFFERENCES

### 5. Campaign Assets Endpoint - Parameter Name
**Frontend Uses:**
```
GET /api/internal/campaigns/:id/assets
```

**Backend Uses:**
```
GET /api/internal/campaigns/:campaignId/assets
```

**Impact:** ✅ **No change needed**
Fastify route params work regardless of the parameter name in the URL. Both `:id` and `:campaignId` resolve to the same value.

However, for clarity, the frontend documentation could update to match:
```typescript
// Both work, but for consistency:
GET /api/internal/campaigns/:campaignId/assets
```

---

### 6. Asset Status Endpoint - Parameter Name
**Frontend Uses:**
```
GET /api/internal/assets/:id/status
```

**Backend Uses:**
```
GET /api/internal/assets/:assetId/status
```

**Impact:** ✅ **No change needed**
Same as above - both parameter names work. No frontend code changes required.

---

## ✅ ENDPOINTS THAT ARE CORRECT

The following endpoints match exactly between frontend expectations and backend implementation:

### Campaigns
- ✅ `GET /api/internal/campaigns`
- ✅ `POST /api/internal/campaigns`
- ✅ `GET /api/internal/campaigns/:id`
- ✅ `PUT /api/internal/campaigns/:id`
- ✅ `DELETE /api/internal/campaigns/:id`
- ✅ `GET /api/internal/campaigns/:id/stats`

### Assets
- ✅ `POST /api/internal/assets`

### PDF
- ✅ `POST /api/internal/pdf/preview`

### Contacts
- ✅ `GET /api/internal/contacts`
- ✅ `POST /api/internal/contacts`
- ✅ `GET /api/internal/contacts/:id`
- ✅ `DELETE /api/internal/contacts/:id`

### Interactions
- ✅ `POST /api/internal/interactions`

### QR Links
- ✅ `GET /api/internal/qr-links/:id`
- ✅ `GET /api/internal/qr-links/:id/analytics`

### Locations
- ✅ `POST /api/internal/locations`

### Tenant Verticals
- ✅ `POST /api/internal/tenant-verticals`

### Plans
- ✅ `GET /api/plans`
- ✅ `GET /api/features/:featureKey/check`
- ✅ `GET /api/plans/limits/:limitKey`

### Gmail
- ✅ `GET /api/internal/gmail/status`
- ✅ `GET /api/internal/gmail/auth-url`
- ✅ `POST /api/internal/gmail/disconnect`
- ✅ `GET /api/internal/gmail/quick-response/:contactId/compose-url`
- ✅ `POST /api/internal/gmail/quick-response/:contactId/track-opened`

---

## 📋 SUMMARY OF REQUIRED FIXES

| Issue | Severity | Action Required |
|-------|----------|-----------------|
| Contact update uses PATCH instead of PUT | 🔴 Critical | Change method from PATCH to PUT |
| POST /q/:id doesn't exist (it's GET) | 🟡 Medium | Remove POST call, use redirect instead |
| Billing portal endpoint missing | 🟡 Medium | Remove feature OR wait for backend implementation |
| Generate-flyer missing locationId param | 🔴 Critical | Add `locationId` to request body |
| Generate-flyer missing layout param | 🟢 Low | Optionally add `layout` to request body |

---

## 🔍 ADDITIONAL ENDPOINTS AVAILABLE (Not in Frontend Docs)

The backend has these additional endpoints that the frontend might want to use:

### Campaigns
- `GET /api/internal/campaigns/:campaignId/generate-pdf` - Bulk PDF generation for multiple locations

### Contacts
- `POST /api/internal/contacts/bulk-import` - Bulk import contacts

### Locations
- `GET /api/internal/locations` - List all locations
- `GET /api/internal/locations/:id` - Get location details
- `PUT /api/internal/locations/:id` - Update location
- `DELETE /api/internal/locations/:id` - Delete location

### QR Links
- `GET /api/internal/qr-links` - List all QR links
- `POST /api/internal/qr-links` - Create QR link
- `PUT /api/internal/qr-links/:id` - Update QR link
- `DELETE /api/internal/qr-links/:id` - Delete QR link

### Assets
- `GET /api/internal/assets` - List all assets
- `GET /api/internal/assets/:id` - Get asset details
- `PUT /api/internal/assets/:id` - Update asset
- `DELETE /api/internal/assets/:id` - Delete asset

### Interactions
- `GET /api/internal/interactions` - List all interactions
- `GET /api/internal/interactions/:id` - Get interaction details
- `PUT /api/internal/interactions/:id` - Update interaction
- `DELETE /api/internal/interactions/:id` - Delete interaction
- `GET /api/internal/interactions/follow-ups/upcoming` - Get upcoming follow-ups

### Map Data
- `GET /api/internal/map-data` - Get pre-aggregated location scan data for maps

### AI
- `POST /api/internal/ai/generate-copy` - Generate marketing copy with AI
- `GET /api/internal/ai/rate-limit` - Check AI rate limit status

---

## 🚀 NEXT STEPS

1. **Update contact update calls** - Change PATCH to PUT
2. **Fix generate-flyer calls** - Add `locationId` parameter
3. **Remove POST /q/:id calls** - Use redirect flow instead
4. **Handle missing billing endpoint** - Either remove feature or wait for backend
5. **Test all endpoints** - Verify fixes work in production
6. **Consider using additional endpoints** - Take advantage of list/update/delete operations

---

## 📞 Questions?

If you need clarification on any of these corrections, please ask! The backend is fully documented in the OpenAPI spec at:
- Local: http://localhost:8080/docs
- Production: https://api.attra.io/docs
